'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Box, Card, CardContent, Typography, Button, IconButton, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Chip, Grid, LinearProgress, Dialog, DialogTitle, DialogContent, 
  DialogActions, MenuItem, FormControl, InputLabel, Select, Drawer, List, 
  ListItem, ListItemIcon, ListItemText, Divider, Checkbox, ListItemButton
} from '@mui/material';
import { 
  Inventory as InventoryIcon, Add, Edit, Delete, Download, Menu as MenuIcon, 
  Search, Refresh, Image as ImageIcon, Category
} from '@mui/icons-material';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { Item, Category, Subcategory } from '@/types';
import { formatCurrency, getStockStatus, getStockStatusLabel } from '@/utils/format';

const COLORS = { primary: '#6B4C9A', drawerWidth: 240 };
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: <InventoryIcon />, href: '/' },
  { id: 'sales', label: 'Sales', icon: <InventoryIcon />, href: '/sales' },
  { id: 'inventory', label: 'Inventory', icon: <InventoryIcon />, href: '/inventory' },
  { id: 'users', label: 'Users', icon: <InventoryIcon />, href: '/users' },
  { id: 'settings', label: 'Settings', icon: <InventoryIcon />, href: '/settings' },
];

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tab, setTab] = useState(0); // 0=items, 1=categories, 2=subcategories
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [form, setForm] = useState({ 
    name: '', sku: '', price_crc: 0, current_weight_grams: 0, 
    min_threshold_grams: 100, category_id: '', subcategory_ids: [] as string[],
    image_url: '', description: '' 
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [itemsRes, catsRes, subsRes] = await Promise.all([
        supabase.from('items').select('*').order('name'),
        supabase.from('categories').select('*').order('display_order'),
        supabase.from('subcategories').select('*').order('name'),
      ]);
      if (itemsRes.data) setItems(itemsRes.data as Item[]);
      if (catsRes.data) setCategories(catsRes.data as Category[]);
      if (subsRes.data) setSubcategories(subsRes.data as Subcategory[]);
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filteredItems = useMemo(() => {
    let result = items.filter(i => i.is_active && !i.deleted_at);
    if (selectedCategory) result = result.filter(i => i.category_id === selectedCategory);
    if (stockFilter !== 'all') result = result.filter(i => getStockStatus(i.current_weight_grams || 0, i.min_threshold_grams || 100) === stockFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(i => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q));
    }
    return result;
  }, [items, selectedCategory, stockFilter, search]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Create a local URL for preview (in production, upload to Supabase Storage)
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm({ ...form, image_url: ev.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    try {
      const itemData = {
        ...form,
        price_crc: Number(form.price_crc),
        current_weight_grams: Number(form.current_weight_grams),
        min_threshold_grams: Number(form.min_threshold_grams),
      };
      
      if (editItem) {
        const { error } = await supabaseAdmin.from('items').update(itemData).eq('id', editItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabaseAdmin.from('items').insert({ 
          ...itemData, 
          id: crypto.randomUUID(), 
          is_active: true, 
          depletion_rate_grams_per_day: 0,
          cost_per_gram: 0,
          created_at: new Date().toISOString() 
        });
        if (error) throw error;
      }
      alert(editItem ? 'Item updated!' : 'Item created!');
      setDialogOpen(false);
      fetchData();
    } catch (e: any) { 
      console.error(e);
      alert('Error: ' + e.message); 
    }
  };

  const handleCategorySave = async (cat?: Category) => {
    try {
      const name = cat ? prompt('New name:', cat.name) : prompt('Category name:');
      if (!name) return;
      
      if (cat) {
        const { error } = await supabaseAdmin.from('categories').update({ name }).eq('id', cat.id);
        if (error) throw error;
      } else {
        const { error } = await supabaseAdmin.from('categories').insert({ 
          id: crypto.randomUUID(), 
          name, 
          display_order: categories.length + 1,
          is_active: true,
          created_at: new Date().toISOString() 
        });
        if (error) throw error;
      }
      fetchData();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const handleSubcategorySave = async (sub?: Subcategory) => {
    try {
      const name = sub ? prompt('New name:', sub.name) : prompt('Subcategory name:');
      const catId = prompt('Category ID (copy from Categories tab):');
      if (!name || !catId) return;
      
      if (sub) {
        const { error } = await supabaseAdmin.from('subcategories').update({ name, category_id: catId }).eq('id', sub.id);
        if (error) throw error;
      } else {
        const { error } = await supabaseAdmin.from('subcategories').insert({ 
          id: crypto.randomUUID(), 
          name, 
          category_id: catId,
          display_order: subcategories.filter(s => s.category_id === catId).length + 1,
          is_active: true,
          created_at: new Date().toISOString() 
        });
        if (error) throw error;
      }
      fetchData();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const handleDelete = async (item: Item) => {
    if (!confirm(`Delete ${item.name}?`)) return;
    const { error } = await supabaseAdmin.from('items').update({ deleted_at: new Date().toISOString() }).eq('id', item.id);
    if (error) {
      alert('Error deleting: ' + error.message);
    } else {
      fetchData();
    }
  };

  const handleExport = () => {
    const csv = ['SKU,Name,Category,Subcategory,Price,Weight,Min Threshold'] + 
      filteredItems.map(i => `${i.sku},${i.name},${categories.find(c => c.id === i.category_id)?.name || ''},${i.subcategory_id ? subcategories.find(s => s.id === i.subcategory_id)?.name || '' : ''},${i.price_crc},${i.current_weight_grams},${i.min_threshold_grams}`).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'inventory.csv'; a.click();
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F7F5F3' }}>
      <Drawer variant="permanent" sx={{ width: drawerOpen ? COLORS.drawerWidth : 72, '& .MuiDrawer-paper': { width: drawerOpen ? COLORS.drawerWidth : 72, bgcolor: COLORS.primary, color: 'white', transition: 'width 0.2s' } }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {drawerOpen && <Typography variant="h6" fontWeight="bold">CrystalPOS</Typography>}
          <IconButton onClick={() => setDrawerOpen(!drawerOpen)} sx={{ color: 'white' }}><MenuIcon /></IconButton>
        </Box>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
        <List>{navItems.map(item => <ListItem key={item.id} component="a" href={item.href} sx={{ bgcolor: item.href === '/inventory' ? 'rgba(255,255,255,0.15)' : 'transparent', cursor: 'pointer', borderRadius: 1, mx: 1 }}><ListItemIcon sx={{ color: 'white', minWidth: drawerOpen ? 40 : 'auto' }}>{item.icon}</ListItemIcon>{drawerOpen && <ListItemText primary={item.label} />}</ListItem>)}</List>
      </Drawer>

      <Box component="main" sx={{ flex: 1, p: 3, overflow: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ color: COLORS.primary }}>Inventory</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" startIcon={<Download />} onClick={handleExport}>Export</Button>
            <Button variant="contained" startIcon={<Add />} onClick={() => { setEditItem(null); setForm({ name: '', sku: '', price_crc: 0, current_weight_grams: 0, min_threshold_grams: 100, category_id: '', subcategory_ids: [], image_url: '', description: '' }); setDialogOpen(true); }}>
              Add Item
            </Button>
          </Box>
        </Box>

        {/* Tabs */}
        <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
          <Button variant={tab === 0 ? 'contained' : 'outlined'} onClick={() => setTab(0)}>Items ({filteredItems.length})</Button>
          <Button variant={tab === 1 ? 'contained' : 'outlined'} onClick={() => setTab(1)}>Categories ({categories.length})</Button>
          <Button variant={tab === 2 ? 'contained' : 'outlined'} onClick={() => setTab(2)}>Subcategories ({subcategories.length})</Button>
        </Box>

        {tab === 0 && (
          <>
            <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField size="small" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} sx={{ minWidth: 200 }} />
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Category</InputLabel>
                <Select value={selectedCategory} label="Category" onChange={e => setSelectedCategory(e.target.value)}>
                  <MenuItem value="">All</MenuItem>
                  {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Stock</InputLabel>
                <Select value={stockFilter} label="Stock" onChange={e => setStockFilter(e.target.value)}>
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="success">In Stock</MenuItem>
                  <MenuItem value="warning">Low</MenuItem>
                  <MenuItem value="error">Out</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {isLoading && <LinearProgress />}

            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Image</TableCell>
                    <TableCell>SKU</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Weight</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredItems.map(item => {
                    const status = getStockStatus(item.current_weight_grams || 0, item.min_threshold_grams || 100);
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                          ) : (
                            <Box sx={{ width: 40, height: 40, bgcolor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}>
                              <ImageIcon sx={{ color: '#999' }} />
                            </Box>
                          )}
                        </TableCell>
                        <TableCell><Typography fontFamily="monospace" fontSize="small">{item.sku}</Typography></TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{categories.find(c => c.id === item.category_id)?.name || '-'}</TableCell>
                        <TableCell align="right">{formatCurrency(item.price_crc)}</TableCell>
                        <TableCell align="right">{item.current_weight_grams}g</TableCell>
                        <TableCell><Chip label={getStockStatusLabel(item.current_weight_grams || 0, item.min_threshold_grams || 100)} size="small" color={status} /></TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => { setEditItem(item); setForm({ name: item.name, sku: item.sku, price_crc: item.price_crc, current_weight_grams: item.current_weight_grams, min_threshold_grams: item.min_threshold_grams, category_id: item.category_id || '', subcategory_ids: item.subcategory_id ? [item.subcategory_id] : [], image_url: item.image_url || '', description: item.description || '' }); setDialogOpen(true); }}>
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDelete(item)}><Delete fontSize="small" /></IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        {tab === 1 && (
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Categories</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleCategorySave()}>Add Category</Button>
              </Box>
              {categories.map(cat => (
                <ListItem key={cat.id} secondaryAction={
                  <>
                    <IconButton onClick={() => handleCategorySave(cat)}><Edit /></IconButton>
                  </>
                }>
                  <ListItemText primary={cat.name} secondary={`Order: ${cat.display_order}`} />
                </ListItem>
              ))}
            </CardContent>
          </Card>
        )}

        {tab === 2 && (
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Subcategories</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleSubcategorySave()}>Add Subcategory</Button>
              </Box>
              {subcategories.map(sub => (
                <ListItem key={sub.id} secondaryAction={
                  <>
                    <IconButton onClick={() => handleSubcategorySave(sub)}><Edit /></IconButton>
                  </>
                }>
                  <ListItemText 
                    primary={sub.name} 
                    secondary={`Category: ${categories.find(c => c.id === sub.category_id)?.name || sub.category_id}`} 
                  />
                </ListItem>
              ))}
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Add/Edit Item Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Image Upload */}
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center' }}>
              <Box 
                sx={{ width: 150, height: 150, bgcolor: '#f5f5f5', borderRadius: 2, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  cursor: 'pointer', overflow: 'hidden', border: '2px dashed #ccc' }}
                onClick={() => fileInputRef.current?.click()}
              >
                {form.image_url ? (
                  <img src={form.image_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <ImageIcon sx={{ fontSize: 48, color: '#ccc' }} />
                )}
              </Box>
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageUpload} />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="SKU" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Price (CRC)" type="number" value={form.price_crc} onChange={e => setForm({ ...form, price_crc: Number(e.target.value) })} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Current Weight (g)" type="number" value={form.current_weight_grams} onChange={e => setForm({ ...form, current_weight_grams: Number(e.target.value) })} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Min Threshold (g)" type="number" value={form.min_threshold_grams} onChange={e => setForm({ ...form, min_threshold_grams: Number(e.target.value) })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select value={form.category_id} label="Category" onChange={e => setForm({ ...form, category_id: e.target.value })}>
                  {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" multiline rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}