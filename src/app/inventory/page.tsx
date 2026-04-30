'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { 
Box, Card, CardContent, Typography, Button, IconButton, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Chip, LinearProgress, Dialog, DialogTitle, DialogContent, 
  DialogActions, MenuItem, FormControl, InputLabel, Select, Drawer, List, 
  ListItem, ListItemIcon, ListItemText, Divider, Checkbox, ListItemButton, Tooltip
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { 
  Inventory as InventoryIcon, Add, Edit, Delete, DeleteSweep, Download, Menu as MenuIcon, 
  Search, Refresh, Image as ImageIcon, Category as CategoryIcon,
  Dashboard as DashboardIcon, ShoppingCart, People, Settings, Assessment, Devices,
  Save, CheckCircle
} from '@mui/icons-material';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { Item, Category as CategoryType, Subcategory } from '@/types';
import { formatCurrency, getStockStatus, getStockStatusLabel } from '@/utils/format';

const COLORS = { primary: '#6B4C9A', drawerWidth: 240 };
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, href: '/' },
  { id: 'sales', label: 'Sales', icon: <ShoppingCart />, href: '/sales' },
  { id: 'inventory', label: 'Inventory', icon: <InventoryIcon />, href: '/inventory' },
  { id: 'reports', label: 'Reports', icon: <Assessment />, href: '/reports' },
  { id: 'todos', label: 'TODOs', icon: <CheckCircle />, href: '/todos' },
  { id: 'customers', label: 'Customers', icon: <People />, href: '/customers' },
  { id: 'users', label: 'Users', icon: <People />, href: '/users' },
  { id: 'devices', label: 'Devices', icon: <Devices />, href: '/devices' },
  { id: 'settings', label: 'Settings', icon: <Settings />, href: '/settings' },
];

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
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
    name: '', sku: '', cost_per_gram: 0, suggested_price_crc: 0, price_crc: 0, 
    pricing_type: 'per_gram' as 'per_gram' | 'fixed', fixed_price_crc: 0,
    current_weight_grams: 0, min_threshold_grams: 100, category_id: '', subcategory_id: '',
    image_url: '', description: '' 
  });

  const [categoryForm, setCategoryForm] = useState({ name: '', name_es: '', description: '', description_es: '' });
  const [subcategoryForm, setSubcategoryForm] = useState({ name: '', name_es: '', description: '', description_es: '', category_id: '' });
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [subcategoryDialogOpen, setSubcategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryType | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [cellValue, setCellValue] = useState('');

  const handleCellClick = (id: string, field: string, value: any) => {
    setEditingCell({ id, field });
    setCellValue(value?.toString() || '');
  };

  const handleCellSave = async (itemId: string, field: string) => {
    try {
      let value: any = cellValue;
      if (['price_crc', 'cost_per_gram', 'suggested_price_crc', 'current_weight_grams', 'min_threshold_grams'].includes(field)) {
        value = Number(cellValue) || 0;
      }
      const { error } = await supabaseAdmin.from('items').update({ [field]: value, updated_at: new Date().toISOString() }).eq('id', itemId);
      if (error) throw error;
      fetchData();
    } catch (e: any) {
      console.error(e);
      alert('Error: ' + e.message);
    }
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, itemId: string, field: string) => {
    if (e.key === 'Enter') {
      handleCellSave(itemId, field);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [itemsRes, catsRes, subsRes] = await Promise.all([
        supabase.from('items').select('*').order('name'),
        supabase.from('categories').select('*').order('display_order'),
        supabase.from('subcategories').select('*').order('name'),
      ]);
      if (itemsRes.data) setItems(itemsRes.data as Item[]);
      if (catsRes.data) setCategories(catsRes.data as CategoryType[]);
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

  const handleCategorySave = async () => {
    try {
      const data = {
        name: categoryForm.name,
        name_es: categoryForm.name_es || null,
        description: categoryForm.description || null,
        description_es: categoryForm.description_es || null,
        display_order: categories.length + 1,
        is_active: true,
        updated_at: new Date().toISOString()
      };
      
      if (editingCategory) {
        const { error } = await supabaseAdmin.from('categories').update(data).eq('id', editingCategory.id);
        if (error) throw error;
      } else {
        const { error } = await supabaseAdmin.from('categories').insert({ 
          id: crypto.randomUUID(), 
          ...data,
          created_at: new Date().toISOString()
        });
        if (error) throw error;
      }
      setCategoryDialogOpen(false);
      setCategoryForm({ name: '', name_es: '', description: '', description_es: '' });
      setEditingCategory(null);
      fetchData();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const handleSubcategorySave = async () => {
    try {
      if (!subcategoryForm.category_id) { alert('Please select a category'); return; }
      
      const data = {
        name: subcategoryForm.name,
        name_es: subcategoryForm.name_es || null,
        description: subcategoryForm.description || null,
        description_es: subcategoryForm.description_es || null,
        category_id: subcategoryForm.category_id,
        display_order: subcategories.filter(s => s.category_id === subcategoryForm.category_id).length + 1,
        is_active: true,
        updated_at: new Date().toISOString()
      };
      
      if (editingSubcategory) {
        const { error } = await supabaseAdmin.from('subcategories').update(data).eq('id', editingSubcategory.id);
        if (error) throw error;
      } else {
        const { error } = await supabaseAdmin.from('subcategories').insert({ 
          id: crypto.randomUUID(), 
          ...data,
          created_at: new Date().toISOString()
        });
        if (error) throw error;
      }
      setSubcategoryDialogOpen(false);
      setSubcategoryForm({ name: '', name_es: '', description: '', description_es: '', category_id: '' });
      setEditingSubcategory(null);
      fetchData();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const openCategoryDialog = (cat?: CategoryType) => {
    if (cat) {
      setEditingCategory(cat);
      setCategoryForm({ name: cat.name, name_es: (cat as any).name_es || '', description: cat.description || '', description_es: (cat as any).description_es || '' });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: '', name_es: '', description: '', description_es: '' });
    }
    setCategoryDialogOpen(true);
  };

  const openSubcategoryDialog = (sub?: Subcategory) => {
    if (sub) {
      setEditingSubcategory(sub);
      setSubcategoryForm({ name: sub.name, name_es: (sub as any).name_es || '', description: sub.description || '', description_es: (sub as any).description_es || '', category_id: sub.category_id });
    } else {
      setEditingSubcategory(null);
      setSubcategoryForm({ name: '', name_es: '', description: '', description_es: '', category_id: '' });
    }
    setSubcategoryDialogOpen(true);
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

  const handleDeleteAllContents = async () => {
    if (!confirm('Are you sure you want to DELETE ALL ITEMS? This cannot be undone. Categories and Subcategories will be preserved.')) return;
    if (!confirm('This will permanently delete all items from the database. Continue?')) return;
    try {
      const { error } = await supabaseAdmin.from('items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      alert('All items deleted successfully!');
      fetchData();
    } catch (e: any) {
      console.error(e);
      alert('Error deleting items: ' + e.message);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F7F5F3' }}>
      <Drawer variant="permanent" sx={{ width: drawerOpen ? COLORS.drawerWidth : 72, '& .MuiDrawer-paper': { width: drawerOpen ? COLORS.drawerWidth : 72, bgcolor: COLORS.primary, color: 'white', transition: 'width 0.2s' } }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {drawerOpen && <Typography variant="h6" sx={{ fontWeight: 'bold' }}>CrystalPOS</Typography>}
          <IconButton onClick={() => setDrawerOpen(!drawerOpen)} sx={{ color: 'white' }}><MenuIcon /></IconButton>
        </Box>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
        <List>{navItems.map(item => <ListItem key={item.id} component="a" href={item.href} sx={{ bgcolor: item.href === '/inventory' ? 'rgba(255,255,255,0.15)' : 'transparent', cursor: 'pointer', borderRadius: 1, mx: 1 }}><ListItemIcon sx={{ color: 'white', minWidth: drawerOpen ? 40 : 'auto' }}>{item.icon}</ListItemIcon>{drawerOpen && <ListItemText primary={item.label} />}</ListItem>)}</List>
      </Drawer>

      <Box component="main" sx={{ flex: 1, p: 3, overflow: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: COLORS.primary }}>Inventory</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" startIcon={<Download />} onClick={handleExport}>Export</Button>
            <Button variant="outlined" color="error" startIcon={<DeleteSweep />} onClick={handleDeleteAllContents}>Delete All Contents</Button>
            <Button variant="contained" startIcon={<Add />} onClick={() => { setEditItem(null); setForm({ name: '', sku: '', cost_per_gram: 0, suggested_price_crc: 0, price_crc: 0, pricing_type: 'per_gram', fixed_price_crc: 0, current_weight_grams: 0, min_threshold_grams: 100, category_id: '', subcategory_id: '', image_url: '', description: '' }); setDialogOpen(true); }}>
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
                    <TableCell align="right">Price/g</TableCell>
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
                        <TableCell 
                          onClick={() => handleCellClick(item.id, 'sku', item.sku)}
                          sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' } }}
                        >
                          {editingCell?.id === item.id && editingCell?.field === 'sku' ? (
                            <TextField size="small" value={cellValue} onChange={(e) => setCellValue(e.target.value)} onBlur={() => handleCellSave(item.id, 'sku')} onKeyDown={(e) => handleKeyDown(e, item.id, 'sku')} autoFocus sx={{ width: 100 }} />
                          ) : (
                            <Typography fontFamily="monospace" fontSize="small">{item.sku}</Typography>
                          )}
                        </TableCell>
                        <TableCell 
                          onClick={() => handleCellClick(item.id, 'name', item.name)}
                          sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' }, minWidth: 150 }}
                        >
                          {editingCell?.id === item.id && editingCell?.field === 'name' ? (
                            <TextField size="small" value={cellValue} onChange={(e) => setCellValue(e.target.value)} onBlur={() => handleCellSave(item.id, 'name')} onKeyDown={(e) => handleKeyDown(e, item.id, 'name')} autoFocus fullWidth />
                          ) : item.name}
                        </TableCell>
                        <TableCell 
                          onClick={() => handleCellClick(item.id, 'category_id', item.category_id)}
                          sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' }, minWidth: 120 }}
                        >
                          {editingCell?.id === item.id && editingCell?.field === 'category_id' ? (
                            <FormControl size="small" fullWidth>
                              <Select value={cellValue} onChange={(e) => { handleCellSave(item.id, 'category_id'); }} autoFocus>
                                {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                              </Select>
                            </FormControl>
                          ) : (
                            categories.find(c => c.id === item.category_id)?.name || '-'
                          )}
                        </TableCell>
                        <TableCell 
                          align="right"
                          onClick={() => handleCellClick(item.id, 'price_crc', item.price_crc)}
                          sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' } }}
                        >
                          {editingCell?.id === item.id && editingCell?.field === 'price_crc' ? (
                            <TextField size="small" type="number" value={cellValue} onChange={(e) => setCellValue(e.target.value)} onBlur={() => handleCellSave(item.id, 'price_crc')} onKeyDown={(e) => handleKeyDown(e, item.id, 'price_crc')} autoFocus sx={{ width: 80 }} />
                          ) : (
                            formatCurrency(item.price_crc)
                          )}
                        </TableCell>
                        <TableCell 
                          align="right"
                          onClick={() => handleCellClick(item.id, 'current_weight_grams', item.current_weight_grams)}
                          sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' } }}
                        >
                          {editingCell?.id === item.id && editingCell?.field === 'current_weight_grams' ? (
                            <TextField size="small" type="number" value={cellValue} onChange={(e) => setCellValue(e.target.value)} onBlur={() => handleCellSave(item.id, 'current_weight_grams')} onKeyDown={(e) => handleKeyDown(e, item.id, 'current_weight_grams')} autoFocus sx={{ width: 80 }} />
                          ) : (
                            `${item.current_weight_grams}g`
                          )}
                        </TableCell>
                        <TableCell><Chip label={getStockStatusLabel(item.current_weight_grams || 0, item.min_threshold_grams || 100)} size="small" color={status} /></TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => { setEditItem(item); setForm({ name: item.name, sku: item.sku, cost_per_gram: item.cost_per_gram || 0, suggested_price_crc: (item as any).suggested_price_crc || 0, price_crc: item.price_crc, pricing_type: (item as any).pricing_type || 'per_gram', fixed_price_crc: (item as any).fixed_price_crc || 0, current_weight_grams: item.current_weight_grams, min_threshold_grams: item.min_threshold_grams, category_id: item.category_id || '', subcategory_id: item.subcategory_id || '', image_url: item.image_url || '', description: item.description || '' }); setDialogOpen(true); }}>
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
                <Button variant="contained" startIcon={<Add />} onClick={() => openCategoryDialog()}>Add Category</Button>
              </Box>
              {categories.map(cat => (
                <ListItem key={cat.id} secondaryAction={
                  <>
                    <IconButton onClick={() => openCategoryDialog(cat)}><Edit /></IconButton>
                  </>
                }>
                  <ListItemText primary={cat.name} secondary={(cat as any).name_es ? `${cat.name} / ${(cat as any).name_es}` : `Order: ${cat.display_order}`} />
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
                <Button variant="contained" startIcon={<Add />} onClick={() => openSubcategoryDialog()}>Add Subcategory</Button>
              </Box>
              {subcategories.map(sub => (
                <ListItem key={sub.id} secondaryAction={
                  <>
                    <IconButton onClick={() => openSubcategoryDialog(sub)}><Edit /></IconButton>
                  </>
                }>
                  <ListItemText 
                    primary={sub.name} 
                    secondary={(sub as any).name_es ? `${sub.name} / ${(sub as any).name_es} - Category: ${categories.find(c => c.id === sub.category_id)?.name || sub.category_id}` : `Category: ${categories.find(c => c.id === sub.category_id)?.name || sub.category_id}`} 
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
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', gap: 2, alignItems: 'center' }}>
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
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button size="small" variant="outlined" onClick={() => fileInputRef.current?.click()}>
                  {form.image_url ? 'Change Image' : 'Add Image'}
                </Button>
                {form.image_url && (
                  <Button size="small" color="error" variant="outlined" onClick={() => setForm({ ...form, image_url: '' })}>
                    Remove Image
                  </Button>
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
              <TextField fullWidth label="Cost per gram (CRC)" type="number" value={form.cost_per_gram} onChange={e => setForm({ ...form, cost_per_gram: Number(e.target.value) })} sx={{ mb: 2, bgcolor: 'white' }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Suggested Price per gram (CRC)" type="number" value={form.suggested_price_crc} onChange={e => setForm({ ...form, suggested_price_crc: Number(e.target.value) })} sx={{ mb: 2, bgcolor: 'white' }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Price (CRC)/g" type="number" value={form.price_crc} onChange={e => setForm({ ...form, price_crc: Number(e.target.value) })} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Pricing Type</InputLabel>
                <Select value={form.pricing_type} label="Pricing Type" onChange={e => setForm({ ...form, pricing_type: e.target.value as 'per_gram' | 'fixed' })}>
                  <MenuItem value="per_gram">Per Gram (weight-based)</MenuItem>
                  <MenuItem value="fixed">Fixed Price (single price)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {form.pricing_type === 'fixed' && (
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Fixed Price (CRC)" type="number" value={form.fixed_price_crc} onChange={e => setForm({ ...form, fixed_price_crc: Number(e.target.value) })} required />
              </Grid>
            )}
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

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onClose={() => setCategoryDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Name (English)" value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} sx={{ mb: 2, mt: 1 }} required />
          <TextField fullWidth label="Nombre (Español)" value={categoryForm.name_es} onChange={e => setCategoryForm({ ...categoryForm, name_es: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth label="Description (English)" value={categoryForm.description} onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth label="Descripción (Español)" value={categoryForm.description_es} onChange={e => setCategoryForm({ ...categoryForm, description_es: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCategorySave}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Subcategory Dialog */}
      <Dialog open={subcategoryDialogOpen} onClose={() => setSubcategoryDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingSubcategory ? 'Edit Subcategory' : 'Add Subcategory'}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
            <InputLabel>Category</InputLabel>
            <Select value={subcategoryForm.category_id} label="Category" onChange={e => setSubcategoryForm({ ...subcategoryForm, category_id: e.target.value })}>
              {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField fullWidth label="Name (English)" value={subcategoryForm.name} onChange={e => setSubcategoryForm({ ...subcategoryForm, name: e.target.value })} sx={{ mb: 2 }} required />
          <TextField fullWidth label="Nombre (Español)" value={subcategoryForm.name_es} onChange={e => setSubcategoryForm({ ...subcategoryForm, name_es: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth label="Description (English)" value={subcategoryForm.description} onChange={e => setSubcategoryForm({ ...subcategoryForm, description: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth label="Descripción (Español)" value={subcategoryForm.description_es} onChange={e => setSubcategoryForm({ ...subcategoryForm, description_es: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubcategoryDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubcategorySave}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}