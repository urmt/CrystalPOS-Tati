// =============================================================================
// IPAD POS PAGE (PWA)
// /pos route - Works offline, auto-syncs when online
// =============================================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, Button, TextField, 
  IconButton, Badge, Divider, List, ListItem, ListItemText, 
  ListItemSecondaryAction, Dialog, DialogTitle, DialogContent, 
  DialogActions, Paper, CircularProgress, Alert, BottomNavigation,
  BottomNavigationAction, AppBar, Toolbar
} from '@mui/material';
import { 
  ShoppingCart, Inventory as InventoryIcon, Dashboard as DashboardIcon,
  Settings, Add, Remove, Delete, Payment, WifiOff, Sync
} from '@mui/icons-material';
import { supabase } from '@/lib/supabase';
import { logErrorAndAlert } from '@/lib/telegram';
import { Item, Category } from '@/types';
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

export default function POSPage() {
  const [currentView, setCurrentView] = useState<'sales' | 'inventory' | 'dashboard'>('sales');
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);
  const [deviceName, setDeviceName] = useState('');
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [deviceId, setDeviceId] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

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
      id = 'device_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  };

  const registerDevice = async (id: string, name?: string) => {
    if (!isOnline) return;
    try {
      const { data, error } = await supabase
        .from('device_registrations')
        .upsert({ device_id: id, device_name: name || `iPad ${id.substr(0, 6)}` }, { onConflict: 'device_id' })
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
        const { items: cachedItems, categories: cachedCats, lastSync: syncTime } = JSON.parse(offlineData);
        setItems(cachedItems || []);
        setCategories(cachedCats || []);
        setLastSync(syncTime);
      }
    } catch (e) {
      console.error('Failed to load offline data:', e);
    }
  }, []);

  const saveOfflineData = (itemsToSave: Item[], catsToSave: Category[]) => {
    try {
      const data = { items: itemsToSave, categories: catsToSave, lastSync: new Date().toISOString() };
      localStorage.setItem(OFFLINE_KEY, JSON.stringify(data));
      setLastSync(data.lastSync);
    } catch (e) {
      console.error('Failed to save offline data:', e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsRes, catsRes] = await Promise.all([
        supabase.from('items').select('*').eq('is_active', true).order('name'),
        supabase.from('categories').select('*').eq('is_active', true).order('display_order')
      ]);
      
      if (itemsRes.error) throw itemsRes.error;
      if (catsRes.error) throw catsRes.error;
      
      if (itemsRes.data) {
        setItems(itemsRes.data);
        saveOfflineData(itemsRes.data, catsRes.data || []);
      }
      if (catsRes.data) setCategories(catsRes.data);
    } catch (err: any) {
      console.error('Fetch error:', err);
      await logErrorAndAlert('Fetch Error', err.message || 'Failed to fetch data', deviceId);
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
        for (const sale of pending) {
          const { error } = await supabase.from('sales').insert(sale);
          if (error) throw error;
        }
        localStorage.removeItem(PENDING_SALES_KEY);
      }
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    const id = generateDeviceId();
    setDeviceId(id);
    
    const init = async () => {
      if (isOnline) {
        await registerDevice(id);
        await fetchData();
        await syncPendingSales();
      } else {
        loadOfflineData();
      }
    };
    
    init();
  }, [isOnline]);

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
          ? { ...c, quantity: c.quantity + 1, subtotal: (c.quantity + 1) * c.item.price }
          : c
      ));
    } else {
      setCart([...cart, { item, quantity: 1, subtotal: item.price }]);
    }
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(cart.map(c => {
      if (c.item.id === itemId) {
        const newQty = Math.max(0, c.quantity + delta);
        return { ...c, quantity: newQty, subtotal: newQty * c.item.price };
      }
      return c;
    }).filter(c => c.quantity > 0));
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.subtotal, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const filteredItems = items.filter(item => {
    const matchesCat = selectedCategory === 'all' || item.category_id === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

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
      <Dialog open={showNameDialog} disableEscapeKeyDown>
        <DialogTitle>Name Your iPad</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>Give this iPad a name for easy identification:</Typography>
          <TextField
            autoFocus
            fullWidth
            label="Device Name"
            placeholder="e.g., Tati's iPad, Market iPad #1"
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleNameSubmit} variant="contained" fullWidth>
            Continue
          </Button>
        </DialogActions>
      </Dialog>
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
                Synced: {new Date(lastSync).toLocaleTimeString()}
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
                  onClick={() => setSelectedCategory('all')}
                >
                  All
                </Button>
                {categories.map(cat => (
                  <Button
                    key={cat.id}
                    size="small"
                    variant={selectedCategory === cat.id ? 'contained' : 'outlined'}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.name}
                  </Button>
                ))}
              </Box>
            </Box>

            {/* Items Grid */}
            <Grid container spacing={2}>
              {filteredItems.map(item => (
                <Grid size={{ xs: 6, sm: 4, md: 3 }} key={item.id}>
                  <Card 
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'grey.50' } }}
                    onClick={() => addToCart(item)}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography fontWeight="bold" noWrap>{item.name}</Typography>
                      <Typography color="primary" fontWeight="bold">
                        {formatCurrency(item.price)}
                      </Typography>
                      {item.stock !== null && (
                        <Typography variant="caption" color="text.secondary">
                          Stock: {item.stock}
                        </Typography>
                      )}
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
                {items.slice(0, 20).map(item => (
                  <ListItem key={item.id}>
                    <ListItemText 
                      primary={item.name} 
                      secondary={`Stock: ${item.stock ?? 'N/A'} | Price: ${formatCurrency(item.price)}`}
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
            <Typography>Status: {isOnline ? 'Online' : 'Offline'}</Typography>
            <Typography>Last Sync: {lastSync ? new Date(lastSync).toLocaleString() : 'Never'}</Typography>
          </Box>
        )}
      </Box>

      {/* Cart Summary */}
      {cart.length > 0 && (
        <Paper sx={{ p: 2, borderTop: '2px solid', borderColor: COLORS.primary }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6">{cartCount} items</Typography>
            <Typography variant="h5" fontWeight="bold" color="primary">
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
            >
              Checkout
            </Button>
          </Box>
        </Paper>
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