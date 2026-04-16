// =============================================================================
// IPAD POS PAGE (PWA)
// /pos route - Works offline, auto-syncs when online
// Version: 1.4 - Fixed text colors + Category conflicts
// =============================================================================

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, Button, TextField, 
  IconButton, Badge, Divider, List, ListItem, ListItemText, 
  Paper, CircularProgress, BottomNavigation,
  BottomNavigationAction, AppBar, Toolbar, Radio, RadioGroup,
  FormControlLabel, FormControl, Dialog, DialogTitle, 
  DialogContent, DialogActions, Select, MenuItem, InputLabel
} from '@mui/material';
import { 
  ShoppingCart, Inventory as InventoryIcon, Dashboard as DashboardIcon,
  Settings, Delete, Payment, WifiOff, Sync, Add, CameraAlt, Close
} from '@mui/icons-material';
import { supabase } from '@/lib/supabase';
import { logErrorAndAlert } from '@/lib/telegram';
import { Item, Category as CategoryType, Subcategory } from '@/types';
import { formatCurrency } from '@/utils/format';

const COLORS = {
  primary: '#6B4C9A',
  secondary: '#D4AF37',
  accent: '#20B2AA',
  success: '#228B22',
  error: '#DC3545',
  darkText: '#1a1a1a',
  lightText: '#333333',
};

interface CartItem {
  item: Item;
  quantity: number;
  subtotal: number;
}

const OFFLINE_KEY = 'crystalpos_offline_data';
const PENDING_SALES_KEY = 'crystalpos_pending_sales';
const DEVICE_ID_KEY = 'crystalpos_device_id';

type PaymentMethod = 'cash' | 'sinpe' | 'card' | '';
type POSView = 'sales' | 'inventory' | 'add' | 'dashboard';

export default function POSPage() {
  const [currentView, setCurrentView] = useState<POSView>('sales');
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);
  const [deviceName, setDeviceName] = useState('');
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [deviceId, setDeviceId] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('');
  const [processing, setProcessing] = useState(false);

  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '', sku: '', price_crc: 0, current_weight_grams: 0,
    category_id: '', subcategory_id: '', description: '', image_url: ''
  });
  const [savingItem, setSavingItem] = useState(false);

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [newSubcategory, setNewSubcategory] = useState({ name: '', category_id: '' });
  const [savingCategory, setSavingCategory] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      window.addEventListener('online', () => setIsOnline(true));
      window.addEventListener('offline', () => setIsOnline(false));
      return () => {
        window.removeEventListener('online', () => setIsOnline(true));
        window.removeEventListener('offline', () => setIsOnline(false));
      };
    }
  }, []);

  const generateDeviceId = () => {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = 'device_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  };

  const registerDevice = async (id: string, name?: string) => {
    if (!isOnline) return;
    try {
      const { data, error } = await supabase
        .from('device_registrations')
        .upsert({ device_id: id, device_name: name || `iPad ${id.substring(0, 6)}` }, { onConflict: 'device_id' })
        .select()
        .single();
      if (error) throw error;
      if (data?.is_blocked) setIsBlocked(true);
    } catch (err) { console.error('Device registration error:', err); }
  };

  const loadOfflineData = useCallback(() => {
    try {
      const offlineData = localStorage.getItem(OFFLINE_KEY);
      if (offlineData) {
        const data = JSON.parse(offlineData);
        setItems(data.items || []);
        setCategories(data.categories || []);
        setSubcategories(data.subcategories || []);
        setLastSync(data.lastSync);
      }
    } catch (e) { console.error('Load offline error:', e); }
  }, []);

  const saveOfflineData = (itms: Item[], cats: CategoryType[], subcats: Subcategory[]) => {
    try {
      const data = { items: itms, categories: cats, subcategories: subcats, lastSync: new Date().toISOString() };
      localStorage.setItem(OFFLINE_KEY, JSON.stringify(data));
      setLastSync(data.lastSync);
    } catch (e) { console.error('Save offline error:', e); }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsRes, catsRes, subcatsRes] = await Promise.all([
        supabase.from('items').select('*').eq('is_active', true).order('name'),
        supabase.from('categories').select('*').eq('is_active', true).order('display_order'),
        supabase.from('subcategories').select('*').eq('is_active', true).order('display_order')
      ]);
      
      if (itemsRes.data) {
        setItems(itemsRes.data);
        saveOfflineData(itemsRes.data, catsRes.data || [], subcatsRes.data || []);
      }
      if (catsRes.data) setCategories(catsRes.data);
      if (subcatsRes.data) setSubcategories(subcatsRes.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Fetch failed';
      console.error('Fetch error:', err);
      await logErrorAndAlert('Fetch Error', msg, deviceId);
      loadOfflineData();
    } finally { setLoading(false); }
  };

  const syncPendingSales = async () => {
    if (!isOnline) return;
    setSyncing(true);
    try {
      const pendingData = localStorage.getItem(PENDING_SALES_KEY);
      if (pendingData) {
        const pending = JSON.parse(pendingData);
        for (const sale of pending) {
          const { error } = await supabase.from('sales').insert(sale);
          if (error) throw error;
        }
        localStorage.removeItem(PENDING_SALES_KEY);
      }
    } catch (err) { console.error('Sync error:', err); }
    finally { setSyncing(false); }
  };

  useEffect(() => {
    const id = generateDeviceId();
    setDeviceId(id);
    const init = async () => {
      if (isOnline) {
        await registerDevice(id);
        await fetchData();
        await syncPendingSales();
      } else { loadOfflineData(); }
    };
    init();
  }, [isOnline, loadOfflineData]);

  const handleNameSubmit = async () => {
    if (deviceName.trim()) {
      await registerDevice(deviceId, deviceName.trim());
      localStorage.setItem('crystalpos_device_name', deviceName.trim());
      setShowNameDialog(false);
    }
  };

  const addToCart = (item: Item) => {
    const existing = cart.find(c => c.item.id === item.id);
    if (existing) {
      setCart(cart.map(c => c.item.id === item.id ? { ...c, quantity: c.quantity + 1, subtotal: (c.quantity + 1) * Number(c.item.price_crc) } : c));
    } else {
      setCart([...cart, { item, quantity: 1, subtotal: Number(item.price_crc) }]);
    }
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(cart.map(c => {
      if (c.item.id === itemId) {
        const newQty = Math.max(0, c.quantity + delta);
        return { ...c, quantity: newQty, subtotal: newQty * Number(c.item.price_crc) };
      }
      return c;
    }).filter(c => c.quantity > 0));
  };

  const createSale = async (): Promise<boolean> => {
    if (cart.length === 0 || !paymentMethod) return false;
    const itemsSold = cart.map(c => ({ item_id: c.item.id, sku: c.item.sku, name: c.item.name, qty_grams: c.quantity, price: c.subtotal }));
    const saleData = {
      sale_date: new Date().toISOString(), items_sold: itemsSold, subtotal_crc: cartTotal,
      tax_crc: 0, total_crc: cartTotal, payment_method: paymentMethod, payment_status: 'completed',
      notes: null, receipt_sent: false, receipt_email: null, created_by_user_id: null,
      server_created_at: new Date().toISOString(), last_modified_at: new Date().toISOString()
    };

    if (isOnline) {
      try {
        const { error } = await supabase.from('sales').insert(saleData);
        if (error) throw error;
        setCart([]); setShowCheckout(false); setPaymentMethod('');
        await fetchData();
        return true;
      } catch (err) { console.error('Online sale failed:', err); }
    }
    try {
      const pending = JSON.parse(localStorage.getItem(PENDING_SALES_KEY) || '[]');
      pending.push(saleData);
      localStorage.setItem(PENDING_SALES_KEY, JSON.stringify(pending));
      setCart([]); setShowCheckout(false); setPaymentMethod('');
      return true;
    } catch (err) { return false; }
  };

  const handleCheckout = async () => {
    if (!paymentMethod) return;
    setProcessing(true);
    await createSale();
    setProcessing(false);
  };

  const handleSaveItem = async () => {
    if (!newItem.name || !newItem.price_crc || !newItem.category_id) {
      alert('Please fill in: Name, Price, Category');
      return;
    }
    setSavingItem(true);
    try {
      if (isOnline) {
        const sku = newItem.sku || `ITEM-${Date.now()}`;
        const { error } = await supabase.from('items').insert({ ...newItem, sku, is_active: true });
        if (error) throw error;
        await fetchData();
      } else {
        alert('Cannot add items while offline.');
      }
      setShowAddItem(false);
      setNewItem({ name: '', sku: '', price_crc: 0, current_weight_grams: 0, category_id: '', subcategory_id: '', description: '', image_url: '' });
    } catch (err) {
      console.error('Save item error:', err);
      alert('Failed to save item');
    } finally { setSavingItem(false); }
  };

  const handleImageSelect = () => { fileInputRef.current?.click(); };
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setNewItem({ ...newItem, image_url: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCategory = async () => {
    if (!newCategory.name) { alert('Category name required'); return; }
    setSavingCategory(true);
    try {
      if (isOnline) {
        const { error } = await supabase.from('categories').insert({
          name: newCategory.name, description: newCategory.description,
          display_order: categories.length + 1, is_active: true
        });
        if (error) throw error;
        await fetchData();
      }
      setShowAddCategory(false);
      setNewCategory({ name: '', description: '' });
    } catch (err) { alert('Failed to save category'); }
    finally { setSavingCategory(false); }
  };

  const handleSaveSubcategory = async () => {
    if (!newSubcategory.name || !newSubcategory.category_id) { alert('Name and Category required'); return; }
    setSavingCategory(true);
    try {
      if (isOnline) {
        const catSubcats = subcategories.filter(s => s.category_id === newSubcategory.category_id);
        const { error } = await supabase.from('subcategories').insert({
          name: newSubcategory.name, category_id: newSubcategory.category_id,
          display_order: catSubcats.length + 1, is_active: true
        });
        if (error) throw error;
        await fetchData();
      }
      setShowAddCategory(false);
      setNewSubcategory({ name: '', category_id: '' });
    } catch (err) { alert('Failed to save'); }
    finally { setSavingCategory(false); }
  };

  const getSubcategoriesForCategory = (catId: string) => subcategories.filter(s => s.category_id === catId);

  const cartTotal = cart.reduce((sum, c) => sum + c.subtotal, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);
  const filteredItems = items.filter(item => {
    const matchesCat = selectedCategory === 'all' || item.category_id === selectedCategory;
    const matchesSub = selectedSubcategory === 'all' || item.subcategory_id === selectedSubcategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSub && matchesSearch;
  });

  if (isBlocked) return (
    <Box sx={{ p: 4, textAlign: 'center', mt: 10, color: COLORS.darkText }}>
      <Typography variant="h4" color="error">Device Blocked</Typography>
      <Typography sx={{ color: COLORS.lightText }}>Contact Systems Manager.</Typography>
      <Typography sx={{ mt: 2, color: COLORS.lightText }}>ID: {deviceId}</Typography>
    </Box>
  );

  if (showNameDialog) return (
    <Box sx={{ p: 4, textAlign: 'center', mt: 10, color: COLORS.darkText }}>
      <Typography variant="h5" sx={{ mb: 2, color: COLORS.darkText }}>Welcome to CrystalPOS</Typography>
      <Typography sx={{ mb: 2, color: COLORS.lightText }}>Name this iPad:</Typography>
      <TextField fullWidth label="Device Name" placeholder="Market #1" value={deviceName} onChange={(e) => setDeviceName(e.target.value)} sx={{ mb: 2 }} />
      <Button variant="contained" fullWidth onClick={handleNameSubmit}>Continue</Button>
    </Box>
  );

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#F7F5F3' }}>
      <AppBar position="static" sx={{ bgcolor: COLORS.primary }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flex: 1, color: 'white' }}>CrystalPOS</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {!isOnline && <WifiOff color="warning" />}
            {syncing && <Sync className="spin" />}
            <Badge badgeContent={cartCount} color="secondary"><ShoppingCart /></Badge>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {currentView === 'sales' && (
          <>
            <TextField fullWidth size="small" placeholder="Search items..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} sx={{ mb: 1, bgcolor: 'white' }} />
            <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
              <Button size="small" variant={selectedCategory === 'all' ? 'contained' : 'outlined'} onClick={() => { setSelectedCategory('all'); setSelectedSubcategory('all'); }}>All</Button>
              {categories.map(cat => (
                <Button key={cat.id} size="small" variant={selectedCategory === cat.id ? 'contained' : 'outlined'} onClick={() => { setSelectedCategory(cat.id); setSelectedSubcategory('all'); }}>{cat.name}</Button>
              ))}
            </Box>
            {selectedCategory !== 'all' && getSubcategoriesForCategory(selectedCategory).length > 0 && (
              <Box sx={{ display: 'flex', gap: 0.5, overflowX: 'auto', pb: 1, ml: 1 }}>
                <Button size="small" variant={selectedSubcategory === 'all' ? 'contained' : 'outlined'} onClick={() => setSelectedSubcategory('all')}>All</Button>
                {getSubcategoriesForCategory(selectedCategory).map(sub => (
                  <Button key={sub.id} size="small" variant={selectedSubcategory === sub.id ? 'contained' : 'outlined'} onClick={() => setSelectedSubcategory(sub.id)}>{sub.name}</Button>
                ))}
              </Box>
            )}
            <Grid container spacing={1.5}>
              {filteredItems.map(item => (
                <Grid size={{ xs: 6, sm: 4, md: 3 }} key={item.id}>
                  <Card sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'grey.50' } }} onClick={() => addToCart(item)}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      {item.image_url && <Box sx={{ width: '100%', height: 60, bgcolor: 'grey.200', borderRadius: 1, mb: 1 }}><img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></Box>}
                      <Typography sx={{ fontWeight: 'bold', fontSize: '0.9rem', color: COLORS.darkText }} noWrap>{item.name}</Typography>
                      <Typography sx={{ color: COLORS.primary, fontWeight: 'bold' }}>{formatCurrency(Number(item.price_crc))}</Typography>
                      <Typography variant="caption" sx={{ color: COLORS.lightText }}>{item.current_weight_grams}g</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {currentView === 'inventory' && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, color: COLORS.darkText }}>Inventory ({items.length})</Typography>
            <Paper>
              <List>
                {items.slice(0, 50).map(item => (
                  <ListItem key={item.id}>
                    <ListItemText primary={<Typography sx={{ color: COLORS.darkText }}>{item.name}</Typography>} secondary={<Typography sx={{ color: COLORS.lightText }}>{item.current_weight_grams}g | {formatCurrency(Number(item.price_crc))}</Typography>} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Box>
        )}

        {currentView === 'add' && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, color: COLORS.darkText }}>Manage Inventory</Typography>
            <Button variant="contained" startIcon={<Add />} onClick={() => setShowAddItem(true)} sx={{ mr: 1, bgcolor: COLORS.primary }}>Add Item</Button>
            <Button variant="outlined" startIcon={<Add />} onClick={() => setShowAddCategory(true)}>Add Category</Button>
          </Box>
        )}

        {currentView === 'dashboard' && (
          <Box sx={{ textAlign: 'center', py: 4, color: COLORS.darkText }}>
            <Typography variant="h5" sx={{ mb: 1, color: COLORS.darkText }}>CrystalPOS</Typography>
            <Typography sx={{ color: COLORS.lightText, mb: 2 }}>Vendor Manager POS</Typography>
            <Divider sx={{ my: 2 }} />
            <Typography sx={{ color: COLORS.darkText }}>Device: {localStorage.getItem('crystalpos_device_name') || 'Unnamed'}</Typography>
            <Typography sx={{ color: COLORS.darkText }}>Status: {isOnline ? 'Online' : 'Offline'}</Typography>
            <Typography sx={{ color: COLORS.darkText }}>Last Sync: {lastSync ? new Date(lastSync).toLocaleString() : 'Never'}</Typography>
            <Typography sx={{ color: COLORS.darkText }}>Items: {items.length}</Typography>
          </Box>
        )}
      </Box>

      {cart.length > 0 && !showCheckout && (
        <Paper sx={{ p: 2, borderTop: '2px solid', borderColor: COLORS.primary }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="h6" sx={{ color: COLORS.darkText }}>{cartCount} items</Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: COLORS.primary }}>{formatCurrency(cartTotal)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" color="error" size="small" startIcon={<Delete />} onClick={() => setCart([])}>Clear</Button>
            <Button variant="contained" color="success" size="small" startIcon={<Payment />} fullWidth onClick={() => setShowCheckout(true)}>Checkout</Button>
          </Box>
        </Paper>
      )}

      {showCheckout && (
        <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <Paper sx={{ p: 3, m: 2, maxWidth: 400, width: '100%', bgcolor: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" sx={{ color: COLORS.darkText }}>Checkout</Typography>
              <IconButton size="small" onClick={() => setShowCheckout(false)}><Close /></IconButton>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {cart.map(c => (
              <Box key={c.item.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                <Typography sx={{ color: COLORS.lightText }}>{c.quantity}x {c.item.name}</Typography>
                <Typography sx={{ color: COLORS.darkText }}>{formatCurrency(c.subtotal)}</Typography>
              </Box>
            ))}
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ mb: 2, color: COLORS.darkText }}>Total: {formatCurrency(cartTotal)}</Typography>
            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <Typography sx={{ mb: 1, color: COLORS.lightText }}>Payment Method:</Typography>
              <RadioGroup row value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
                <FormControlLabel value="cash" control={<Radio />} label={<Typography sx={{ color: COLORS.darkText }}>Cash</Typography>} />
                <FormControlLabel value="sinpe" control={<Radio />} label={<Typography sx={{ color: COLORS.darkText }}>SINPE</Typography>} />
                <FormControlLabel value="card" control={<Radio />} label={<Typography sx={{ color: COLORS.darkText }}>Card</Typography>} />
              </RadioGroup>
            </FormControl>
            <Button variant="contained" color="success" fullWidth size="large" disabled={!paymentMethod || processing} onClick={handleCheckout} sx={{ bgcolor: COLORS.success }}>
              {processing ? 'Processing...' : 'Complete Sale'}
            </Button>
            {!isOnline && <Typography variant="caption" sx={{ color: COLORS.lightText, display: 'block', mt: 1 }}>Offline - Will sync when online</Typography>}
          </Paper>
        </Box>
      )}

      {/* ADD ITEM DIALOG */}
      <Dialog open={showAddItem} onClose={() => setShowAddItem(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: COLORS.darkText }}>Add New Item</DialogTitle>
        <DialogContent>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} style={{ display: 'none' }} />
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Button variant="outlined" startIcon={<CameraAlt />} onClick={handleImageSelect}>Take Photo</Button>
          </Box>
          {newItem.image_url && <Box sx={{ width: '100%', height: 150, bgcolor: 'grey.200', borderRadius: 1, mb: 2 }}><img src={newItem.image_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></Box>}
          <TextField fullWidth label="Item Name *" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} sx={{ mb: 2, bgcolor: 'white' }} />
          <TextField fullWidth label="Price (CRC) *" type="number" value={newItem.price_crc} onChange={(e) => setNewItem({ ...newItem, price_crc: Number(e.target.value) })} sx={{ mb: 2, bgcolor: 'white' }} />
          <TextField fullWidth label="Weight (grams)" type="number" value={newItem.current_weight_grams} onChange={(e) => setNewItem({ ...newItem, current_weight_grams: Number(e.target.value) })} sx={{ mb: 2, bgcolor: 'white' }} />
          <FormControl fullWidth sx={{ mb: 2, bgcolor: 'white' }}>
            <InputLabel>Category *</InputLabel>
            <Select value={newItem.category_id} label="Category *" onChange={(e) => setNewItem({ ...newItem, category_id: e.target.value })}>
              {categories.map(cat => <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2, bgcolor: 'white' }}>
            <InputLabel>Subcategory</InputLabel>
            <Select value={newItem.subcategory_id} label="Subcategory" onChange={(e) => setNewItem({ ...newItem, subcategory_id: e.target.value })}>
              <MenuItem value="">None</MenuItem>
              {newItem.category_id && getSubcategoriesForCategory(newItem.category_id).map(sub => <MenuItem key={sub.id} value={sub.id}>{sub.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField fullWidth label="Description" value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} multiline rows={2} sx={{ bgcolor: 'white' }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddItem(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveItem} disabled={savingItem} sx={{ bgcolor: COLORS.primary }}>{savingItem ? 'Saving...' : 'Save Item'}</Button>
        </DialogActions>
      </Dialog>

      {/* ADD CATEGORY DIALOG */}
      <Dialog open={showAddCategory} onClose={() => setShowAddCategory(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: COLORS.darkText }}>Add Category/Subcategory</DialogTitle>
        <DialogContent>
          <Typography variant="h6" sx={{ mb: 2, color: COLORS.darkText }}>New Category</Typography>
          <TextField fullWidth label="Category Name" value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} sx={{ mb: 2, bgcolor: 'white' }} />
          <TextField fullWidth label="Description" value={newCategory.description} onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })} sx={{ mb: 3, bgcolor: 'white' }} />
          <Button variant="contained" onClick={handleSaveCategory} disabled={savingCategory} sx={{ mb: 4, bgcolor: COLORS.primary }}>
            {savingCategory ? 'Saving...' : 'Save Category'}
          </Button>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h6" sx={{ mb: 2, color: COLORS.darkText }}>New Subcategory</Typography>
          <FormControl fullWidth sx={{ mb: 2, bgcolor: 'white' }}>
            <InputLabel>Parent Category</InputLabel>
            <Select value={newSubcategory.category_id} label="Parent Category" onChange={(e) => setNewSubcategory({ ...newSubcategory, category_id: e.target.value })}>
              {categories.map(cat => <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField fullWidth label="Subcategory Name" value={newSubcategory.name} onChange={(e) => setNewSubcategory({ ...newSubcategory, name: e.target.value })} sx={{ mb: 2, bgcolor: 'white' }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddCategory(false)}>Close</Button>
          <Button variant="contained" onClick={handleSaveSubcategory} disabled={savingCategory} sx={{ bgcolor: COLORS.primary }}>
            {savingCategory ? 'Saving...' : 'Save Subcategory'}
          </Button>
        </DialogActions>
      </Dialog>

      <BottomNavigation value={currentView} onChange={(_, v) => setCurrentView(v)} sx={{ bgcolor: 'white' }}>
        <BottomNavigationAction value="sales" label="Sales" icon={<ShoppingCart />} />
        <BottomNavigationAction value="inventory" label="Inventory" icon={<InventoryIcon />} />
        <BottomNavigationAction value="add" label="Add" icon={<Add />} />
        <BottomNavigationAction value="dashboard" label="Settings" icon={<DashboardIcon />} />
      </BottomNavigation>
    </Box>
  );
}