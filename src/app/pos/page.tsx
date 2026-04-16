// =============================================================================
// IPAD POS PAGE (PWA)
// /pos route - Works offline, auto-syncs when online
// Version: 1.2 - Fixed checkout flow
// =============================================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, Button, TextField, 
  IconButton, Badge, Divider, List, ListItem, ListItemText, 
  Paper, CircularProgress, BottomNavigation,
  BottomNavigationAction, AppBar, Toolbar, Radio, RadioGroup,
  FormControlLabel, FormControl
} from '@mui/material';
import { 
  ShoppingCart, Inventory as InventoryIcon, Dashboard as DashboardIcon,
  Settings, Delete, Payment, WifiOff, Sync, Close
} from '@mui/icons-material';
import { supabase } from '@/lib/supabase';
import { logErrorAndAlert } from '@/lib/telegram';
import { Item, Category, Subcategory } from '@/types';
import { formatCurrency } from '@/utils/format';

const COLORS = {
  primary: '#6B4C9A',
  secondary: '#D4AF37',
  accent: '#20B2AA',
  success: '#228B22',
  error: '#DC3545',
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

export default function POSPage() {
  const [currentView, setCurrentView] = useState<'sales' | 'inventory' | 'dashboard'>('sales');
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
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
  
  // Checkout state
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
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
      if (data?.is_blocked) {
        setIsBlocked(true);
      }
    } catch (err) {
      console.error('Device registration error:', err);
    }
  };

  const loadOfflineData = useCallback(() => {
    try {
      const offlineData = localStorage.getItem(OFFLINE_KEY);
      if (offlineData) {
        const { items: cachedItems, categories: cachedCats, subcategories: cachedSubcats, lastSync: syncTime } = JSON.parse(offlineData);
        setItems(cachedItems || []);
        setCategories(cachedCats || []);
        setSubcategories(cachedSubcats || []);
        setLastSync(syncTime);
      }
    } catch (e) {
      console.error('Failed to load offline data:', e);
    }
  }, []);

  const saveOfflineData = (itemsToSave: Item[], catsToSave: Category[], subcatsToSave: Subcategory[]) => {
    try {
      const data = { items: itemsToSave, categories: catsToSave, subcategories: subcatsToSave, lastSync: new Date().toISOString() };
      localStorage.setItem(OFFLINE_KEY, JSON.stringify(data));
      setLastSync(data.lastSync);
    } catch (e) {
      console.error('Failed to save offline data:', e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsRes, catsRes, subcatsRes] = await Promise.all([
        supabase.from('items').select('*').eq('is_active', true).order('name'),
        supabase.from('categories').select('*').eq('is_active', true).order('display_order'),
        supabase.from('subcategories').select('*').eq('is_active', true).order('display_order')
      ]);
      
      if (itemsRes.error) throw itemsRes.error;
      if (catsRes.error) throw catsRes.error;
      
      if (itemsRes.data) {
        setItems(itemsRes.data);
        saveOfflineData(itemsRes.data, catsRes.data || [], subcatsRes.data || []);
      }
      if (catsRes.data) setCategories(catsRes.data);
      if (subcatsRes.data) setSubcategories(subcatsRes.data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      console.error('Fetch error:', err);
      await logErrorAndAlert('Fetch Error', errorMessage, deviceId);
      loadOfflineData();
    } finally {
      setLoading(false);
    }
  };

  const syncPendingSales = async () => {
    if (!isOnline) return;
    setSyncing(true);
    try {
      const pendingData = localStorage.getItem(PENDING_SALES_KEY);
      if (pendingData) {
        const pending = JSON.parse(pendingData);
        const successful: number[] = [];
        for (let i = 0; i < pending.length; i++) {
          const sale = pending[i];
          const { error } = await supabase.from('sales').insert(sale);
          if (error) throw error;
          successful.push(i);
        }
        // Remove successfully synced sales
        const remaining = pending.filter((_: unknown, idx: number) => !successful.includes(idx));
        if (remaining.length > 0) {
          localStorage.setItem(PENDING_SALES_KEY, JSON.stringify(remaining));
        } else {
          localStorage.removeItem(PENDING_SALES_KEY);
        }
      }
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setSyncing(false);
    }
  };

  const checkBlockedDevice = async () => {
    if (!isOnline || !deviceId) return;
    try {
      const { data, error } = await supabase
        .from('device_registrations')
        .select('is_blocked')
        .eq('device_id', deviceId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      if (data?.is_blocked) {
        setIsBlocked(true);
      }
    } catch (err) {
      console.error('Check blocked error:', err);
    }
  };

  useEffect(() => {
    const id = generateDeviceId();
    setDeviceId(id);
    
    const init = async () => {
      if (isOnline) {
        await registerDevice(id);
        await checkBlockedDevice();
        await fetchData();
        await syncPendingSales();
      } else {
        loadOfflineData();
      }
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
      setCart(cart.map(c => 
        c.item.id === item.id 
          ? { ...c, quantity: c.quantity + 1, subtotal: (c.quantity + 1) * Number(c.item.price_crc) }
          : c
      ));
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
    
    const itemsSold = cart.map(c => ({
      item_id: c.item.id,
      sku: c.item.sku,
      name: c.item.name,
      qty_grams: c.quantity,
      price: c.subtotal
    }));
    
    const saleData = {
      sale_date: new Date().toISOString(),
      items_sold: itemsSold,
      subtotal_crc: cartTotal,
      tax_crc: 0,
      total_crc: cartTotal,
      payment_method: paymentMethod,
      payment_status: 'completed',
      notes: null,
      receipt_sent: false,
      receipt_email: null,
      created_by_user_id: null,
      server_created_at: new Date().toISOString(),
      last_modified_at: new Date().toISOString()
    };

    // Try online first
    if (isOnline) {
      try {
        const { error } = await supabase.from('sales').insert(saleData);
        if (error) throw error;
        setCart([]);
        setShowCheckout(false);
        setPaymentMethod('');
        await fetchData(); // Refresh inventory
        return true;
      } catch (err) {
        console.error('Online sale failed, trying offline:', err);
        // Fall through to offline
      }
    }

    // Offline: save to pending queue
    try {
      const pendingData = localStorage.getItem(PENDING_SALES_KEY);
      const pending = pendingData ? JSON.parse(pendingData) : [];
      pending.push(saleData);
      localStorage.setItem(PENDING_SALES_KEY, JSON.stringify(pending));
      setCart([]);
      setShowCheckout(false);
      setPaymentMethod('');
      return true;
    } catch (err) {
      console.error('Failed to save offline sale:', err);
      return false;
    }
  };

  const handleCheckout = async () => {
    if (!paymentMethod) return;
    setProcessing(true);
    const success = await createSale();
    setProcessing(false);
    
    if (!success) {
      alert('Failed to process sale. Please try again.');
    }
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.subtotal, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const filteredItems = items.filter(item => {
    const matchesCat = selectedCategory === 'all' || item.category_id === selectedCategory;
    const matchesSubcat = selectedSubcategory === 'all' || item.subcategory_id === selectedSubcategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSubcat && matchesSearch;
  });

  const getSubcategoriesForCategory = (catId: string) => {
    return subcategories.filter(sc => sc.category_id === catId);
  };

  if (isBlocked) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', mt: 10 }}>
        <Typography variant="h4" color="error" gutterBottom>Device Blocked</Typography>
        <Typography>Contact Systems Manager to unblock this device.</Typography>
        <Typography sx={{ mt: 2 }}>Device ID: {deviceId}</Typography>
      </Box>
    );
  }

  if (showNameDialog) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', mt: 10 }}>
        <Typography variant="h5" gutterBottom>Welcome to CrystalPOS</Typography>
        <Typography sx={{ mb: 2 }}>Give this iPad a name:</Typography>
        <TextField
          fullWidth
          label="Device Name"
          placeholder="e.g., Tati's iPad, Market #1"
          value={deviceName}
          onChange={(e) => setDeviceName(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button variant="contained" fullWidth onClick={handleNameSubmit}>
          Continue
        </Button>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#F7F5F3' }}>
      {/* Top Bar */}
      <AppBar position="static" sx={{ bgcolor: COLORS.primary }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flex: 1 }}>CrystalPOS</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {!isOnline && <WifiOff color="warning" />}
            {syncing && <Sync className="spin" />}
            {lastSync && (
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {new Date(lastSync).toLocaleTimeString()}
              </Typography>
            )}
            <Badge badgeContent={cartCount} color="secondary">
              <ShoppingCart />
            </Badge>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {currentView === 'sales' && (
          <>
            {/* Search & Category Filter */}
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ mb: 1 }}
              />
              <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
                <Button 
                  size="small" 
                  variant={selectedCategory === 'all' ? 'contained' : 'outlined'}
                  onClick={() => { setSelectedCategory('all'); setSelectedSubcategory('all'); }}
                >
                  All
                </Button>
                {categories.map(cat => (
                  <Button
                    key={cat.id}
                    size="small"
                    variant={selectedCategory === cat.id ? 'contained' : 'outlined'}
                    onClick={() => { setSelectedCategory(cat.id); setSelectedSubcategory('all'); }}
                  >
                    {cat.name}
                  </Button>
                ))}
              </Box>
              {selectedCategory !== 'all' && getSubcategoriesForCategory(selectedCategory).length > 0 && (
                <Box sx={{ display: 'flex', gap: 0.5, overflowX: 'auto', pb: 1, ml: 1 }}>
                  {getSubcategoriesForCategory(selectedCategory).map(subcat => (
                    <Button
                      key={subcat.id}
                      size="small"
                      variant={selectedSubcategory === subcat.id ? 'contained' : 'outlined'}
                      onClick={() => setSelectedSubcategory(subcat.id)}
                    >
                      {subcat.name}
                    </Button>
                  ))}
                </Box>
              )}
            </Box>

            {/* Items Grid */}
            <Grid container spacing={1.5}>
              {filteredItems.map(item => (
                <Grid size={{ xs: 6, sm: 4, md: 3 }} key={item.id}>
                  <Card 
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'grey.50' } }}
                    onClick={() => addToCart(item)}
                  >
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography sx={{ fontWeight: 'bold', fontSize: '0.9rem' }} noWrap>{item.name}</Typography>
                      <Typography sx={{ color: COLORS.primary, fontWeight: 'bold', fontSize: '1.1rem' }}>
                        {formatCurrency(Number(item.price_crc))}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.current_weight_grams > 0 ? `${item.current_weight_grams}g` : 'In stock'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {currentView === 'inventory' && (
          <Box>
            <Typography variant="h6" gutterBottom>Inventory</Typography>
            <Paper>
              <List>
                {items.slice(0, 30).map(item => (
                  <ListItem key={item.id}>
                    <ListItemText 
                      primary={item.name} 
                      secondary={`${item.current_weight_grams}g | ${formatCurrency(Number(item.price_crc))}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Box>
        )}

        {currentView === 'dashboard' && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h5" gutterBottom>CrystalPOS</Typography>
            <Typography color="text.secondary">Vendor Manager POS</Typography>
            <Divider sx={{ my: 2 }} />
            <Typography>Device: {localStorage.getItem('crystalpos_device_name') || 'Unnamed'}</Typography>
            <Typography>Status: {isOnline ? 'Online ✓' : 'Offline ⚠️'}</Typography>
            <Typography>Last Sync: {lastSync ? new Date(lastSync).toLocaleString() : 'Never'}</Typography>
          </Box>
        )}
      </Box>

      {/* Cart Summary */}
      {cart.length > 0 && !showCheckout && (
        <Paper sx={{ p: 2, borderTop: '2px solid', borderColor: COLORS.primary }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6">{cartCount} items</Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: COLORS.primary }}>
              {formatCurrency(cartTotal)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="outlined" 
              color="error" 
              size="small"
              startIcon={<Delete />}
              onClick={() => setCart([])}
            >
              Clear
            </Button>
            <Button 
              variant="contained" 
              color="success"
              size="small"
              startIcon={<Payment />}
              fullWidth
              onClick={() => setShowCheckout(true)}
            >
              Checkout
            </Button>
          </Box>
        </Paper>
      )}

      {/* Checkout Dialog */}
      {showCheckout && (
        <Box sx={{
          position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.5)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <Paper sx={{ p: 3, m: 2, maxWidth: 400, width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Checkout</Typography>
              <IconButton size="small" onClick={() => setShowCheckout(false)}><Close /></IconButton>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Typography variant="body2" color="text.secondary" gutterBottom>Items:</Typography>
            {cart.map(c => (
              <Box key={c.item.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                <Typography variant="body2">{c.quantity}x {c.item.name}</Typography>
                <Typography variant="body2">{formatCurrency(c.subtotal)}</Typography>
              </Box>
            ))}
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" sx={{ mb: 1 }}>Total: {formatCurrency(cartTotal)}</Typography>
            
            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>Payment Method:</Typography>
              <RadioGroup row value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
                <FormControlLabel value="cash" control={<Radio />} label="Cash" />
                <FormControlLabel value="sinpe" control={<Radio />} label="SINPE" />
                <FormControlLabel value="card" control={<Radio />} label="Card" />
              </RadioGroup>
            </FormControl>
            
            <Button 
              variant="contained" 
              color="success"
              fullWidth
              size="large"
              disabled={!paymentMethod || processing}
              onClick={handleCheckout}
            >
              {processing ? 'Processing...' : 'Complete Sale'}
            </Button>
            
            {!isOnline && (
              <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                Offline - Sale will sync when online
              </Typography>
            )}
          </Paper>
        </Box>
      )}

      {/* Bottom Navigation */}
      <BottomNavigation
        value={currentView}
        onChange={(_, v) => setCurrentView(v)}
        sx={{ bgcolor: 'white' }}
      >
        <BottomNavigationAction value="sales" label="Sales" icon={<ShoppingCart />} />
        <BottomNavigationAction value="inventory" label="Inventory" icon={<InventoryIcon />} />
        <BottomNavigationAction value="dashboard" label="Settings" icon={<DashboardIcon />} />
      </BottomNavigation>
    </Box>
  );
}