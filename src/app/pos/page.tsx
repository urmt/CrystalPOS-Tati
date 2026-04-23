// =============================================================================
// IPAD POS PAGE (PWA)
// /pos route - Works offline, auto-syncs when online
// Version: 1.6 - Gallery View with Carousel + Idle Detection + Spanish Help
// =============================================================================

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Box, Typography, Card, CardContent, Button, TextField, 
  IconButton, Badge, Divider, List, ListItem, ListItemText, 
  Paper, CircularProgress, BottomNavigation,
  BottomNavigationAction, AppBar, Toolbar, Radio, RadioGroup,
  FormControlLabel, FormControl, Dialog, DialogTitle, 
  DialogContent, DialogActions, Select, MenuItem, InputLabel, Chip, Tooltip
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { 
  ShoppingCart, Inventory as InventoryIcon, Dashboard as DashboardIcon,
  Settings, Delete, Payment, WifiOff, Sync, Add, CameraAlt, Close,
  ChevronLeft, ChevronRight, CollectionsBookmark, PlayArrow, Pause
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
  warning: '#FF9800',
  darkText: '#1a1a1a',
  lightText: '#333333',
};

// Crystal gradient theme - gold & purple with shimmer
const crystalTheme = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes sparkle {
    0%, 100% { opacity: 0; transform: scale(0); }
    50% { opacity: 1; transform: scale(1); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
  }
  @keyframes gradient-shift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes gold-pulse {
    0%, 100% { box-shadow: 0 0 15px rgba(212, 175, 55, 0.4); }
    50% { box-shadow: 0 0 30px rgba(212, 175, 55, 0.7); }
  }
  .crystal-bg {
    background: linear-gradient(135deg, 
      #2d1b4e 0%, 
      #1a0a2e 15%,
      #4a2c6a 30%,
      #6B4C9A 50%,
      #3d2666 70%,
      #1a0a2e 85%,
      #2d1b4e 100%
    );
    background-size: 400% 400%;
    animation: gradient-shift 12s ease infinite;
    position: relative;
    overflow: hidden;
  }
  .crystal-bg::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(ellipse at 15% 15%, rgba(212, 175, 55, 0.25) 0%, transparent 50%),
      radial-gradient(ellipse at 85% 85%, rgba(107, 76, 154, 0.3) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 30%, rgba(212, 175, 55, 0.15) 0%, transparent 40%);
    animation: shimmer 6s linear infinite;
    pointer-events: none;
  }
  .crystal-bg::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 70%, rgba(212, 175, 55, 0.1) 0%, transparent 20%),
      radial-gradient(circle at 80% 20%, rgba(107, 76, 154, 0.15) 0%, transparent 25%),
      radial-gradient(circle at 60% 80%, rgba(32, 178, 170, 0.08) 0%, transparent 20%);
    animation: shimmer 10s linear infinite reverse;
    pointer-events: none;
  }
  .glass-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(212, 175, 55, 0.25);
    border-radius: 16px;
    animation: gold-pulse 4s ease-in-out infinite;
  }
  .glass-card-subtle {
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 12px;
  }
  .gold-glow {
    text-shadow: 0 0 10px rgba(212, 175, 55, 0.6), 0 0 20px rgba(212, 175, 55, 0.4);
  }
  .gold-border {
    border-color: rgba(212, 175, 55, 0.5) !important;
  }
  .purple-glow {
    text-shadow: 0 0 8px rgba(107, 76, 154, 0.5);
  }
  .MuiButton-outlined {
    border-color: rgba(100, 149, 237, 0.9) !important;
    color: #6495ED !important;
    background: rgba(100, 149, 237, 0.1) !important;
  }
  .MuiButton-outlined:hover {
    border-color: #4169E1 !important;
    background: rgba(100, 149, 237, 0.25) !important;
  }
`;

interface CartItem {
  item: Item;
  quantity: number;
  subtotal: number;
}

// =============================================================================
// Stock Warning System
// Returns warning level based on days until stock runs out
// =============================================================================
const getStockWarning = (item: Item): { level: 'none' | 'warning' | 'critical' | 'out'; days: number; message: string } => {
  const stock = item.current_weight_grams || 0;
  const rate = item.depletion_rate_grams_per_day || 0;
  
  // Out of stock
  if (stock <= 0) {
    return { level: 'out', days: 0, message: 'OUT OF STOCK' };
  }
  
  // No depletion rate = unknown
  if (rate <= 0) {
    return { level: 'none', days: 999, message: 'In stock - rate unknown' };
  }
  
  // Calculate days until empty
  const daysUntilEmpty = Math.round(stock / rate);
  
  // Critical: less than 30 days (red)
  if (daysUntilEmpty <= 30) {
    return { level: 'critical', days: daysUntilEmpty, message: `Run out in ${daysUntilEmpty} days!` };
  }
  
  // Warning: less than 60 days (orange)
  if (daysUntilEmpty <= 60) {
    return { level: 'warning', days: daysUntilEmpty, message: `Low stock - ${daysUntilEmpty} days left` };
  }
  
  // Good stock
  return { level: 'none', days: daysUntilEmpty, message: `~${daysUntilEmpty} days` };
};

const OFFLINE_KEY = 'crystalpos_offline_data';
const PENDING_SALES_KEY = 'crystalpos_pending_sales';
const DEVICE_ID_KEY = 'crystalpos_device_id';

type PaymentMethod = 'cash' | 'sinpe' | 'card' | '';
type POSView = 'sales' | 'inventory' | 'add' | 'dashboard' | 'gallery';

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
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountOverride, setDiscountOverride] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('');
  const [processing, setProcessing] = useState(false);

  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '', sku: '', price_crc: 0, suggested_price_crc: 0, cost_per_gram: 0,
    current_weight_grams: 0, min_threshold_grams: 100,
    category_id: '', subcategory_id: '', description: '', image_url: ''
  });
  const [savingItem, setSavingItem] = useState(false);

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [newSubcategory, setNewSubcategory] = useState({ name: '', category_id: '' });
  const [savingCategory, setSavingCategory] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const slideIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [isIdle, setIsIdle] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailItem, setDetailItem] = useState<Item | null>(null);
  const [detailWeight, setDetailWeight] = useState(100);
  const [detailFinalPrice, setDetailFinalPrice] = useState<number | null>(null);
  const [showHelpTooltips, setShowHelpTooltips] = useState(true);
  const [manualSlideshow, setManualSlideshow] = useState(false);

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
      } else { loadOfflineData(); }
    };
    init();
  }, [isOnline, loadOfflineData]);

  // Idle detection - reset timer on any interaction
  const resetIdleTimer = useCallback(() => {
    // Don't reset if manual slideshow is active
    if (manualSlideshow) return;
    
    setIsIdle(false);
    if (slideIntervalRef.current) {
      clearInterval(slideIntervalRef.current);
      slideIntervalRef.current = null;
    }
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true);
      // Start slideshow - top 10 items, 6 seconds each
      slideIntervalRef.current = setInterval(() => {
        setGalleryIndex(prev => (prev + 1) % Math.min(sortedItems.length, 10));
      }, 6000);
    }, 60000); // 60 seconds
  }, [items.length, manualSlideshow]);

  // Toggle slideshow manually
  const toggleSlideshow = useCallback(() => {
    if (manualSlideshow) {
      // Stop manual slideshow
      setManualSlideshow(false);
      setIsIdle(false);
      if (slideIntervalRef.current) {
        clearInterval(slideIntervalRef.current);
        slideIntervalRef.current = null;
      }
    } else {
      // Start manual slideshow - top 10 items, 6 seconds each
      setManualSlideshow(true);
      setIsIdle(true);
      slideIntervalRef.current = setInterval(() => {
        setGalleryIndex(prev => (prev + 1) % Math.min(sortedItems.length, 10));
      }, 6000);
    }
  }, [manualSlideshow, items.length]);

  // Attach global idle detection
  useEffect(() => {
    const events = ['touchstart', 'touchmove', 'touchend', 'click', 'scroll', 'keydown'];
    events.forEach(event => {
      document.addEventListener(event, resetIdleTimer);
    });
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetIdleTimer);
      });
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (slideIntervalRef.current) clearInterval(slideIntervalRef.current);
    };
  }, [resetIdleTimer]);

  // Helper to get display price for an item
const getDisplayPrice = (item: Item) => {
  const pricingType = (item as any).pricing_type || 'per_gram';
  if (pricingType === 'fixed') {
    return (item as any).fixed_price_crc || 0;
  }
  return Number(item.price_crc);
};

// Helper to check if item is fixed price
const isFixedPrice = (item: Item) => {
  return (item as any).pricing_type === 'fixed';
};
  const sortedItems = [...items].sort((a, b) => getDisplayPrice(b) - getDisplayPrice(a));

  const handleGallerySwipe = (direction: 'prev' | 'next') => {
    resetIdleTimer();
    if (direction === 'next') {
      setGalleryIndex((galleryIndex + 1) % sortedItems.length);
    } else {
      setGalleryIndex((galleryIndex - 1 + sortedItems.length) % sortedItems.length);
    }
  };

  const handleGalleryTap = (item: Item) => {
    resetIdleTimer();
    setDetailItem(item);
    setDetailWeight(100);
    setDetailFinalPrice(null);
    setShowDetailModal(true);
  };

  const addFromDetail = () => {
    if (!detailItem) return;
    let finalPrice: number;
    let quantity: number;
    
    if (isFixedPrice(detailItem)) {
      // Fixed price: use fixed price directly, quantity = 1
      finalPrice = detailFinalPrice !== null ? detailFinalPrice : getDisplayPrice(detailItem);
      quantity = 1;
    } else {
      // Per-gram price: calculate based on weight
      finalPrice = detailFinalPrice !== null ? detailFinalPrice : Number(detailItem.price_crc) * detailWeight;
      quantity = detailWeight;
    }
    
    const existing = cart.find(c => c.item.id === detailItem.id);
    if (existing) {
      setCart(cart.map(c => c.item.id === detailItem.id ? { ...c, quantity: c.quantity + quantity, subtotal: c.subtotal + finalPrice } : c));
    } else {
      setCart([...cart, { item: detailItem, quantity, subtotal: finalPrice }]);
    }
    setShowDetailModal(false);
  };

  const handleNameSubmit = async () => {
    if (deviceName.trim()) {
      await registerDevice(deviceId, deviceName.trim());
      localStorage.setItem('crystalpos_device_name', deviceName.trim());
      setShowNameDialog(false);
    }
  };

  const addToCart = (item: Item) => {
    const existing = cart.find(c => c.item.id === item.id);
    const price = isFixedPrice(item) ? getDisplayPrice(item) : Number(item.price_crc);
    const qty = isFixedPrice(item) ? 1 : 1;
    
    if (existing) {
      const newQty = existing.quantity + qty;
      setCart(cart.map(c => c.item.id === item.id ? { ...c, quantity: newQty, subtotal: newQty * price } : c));
    } else {
      setCart([...cart, { item, quantity: qty, subtotal: price }]);
    }
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(cart.map(c => {
      if (c.item.id === itemId) {
        const price = isFixedPrice(c.item) ? getDisplayPrice(c.item) : Number(c.item.price_crc);
        const step = isFixedPrice(c.item) ? 1 : 1;
        const newQty = Math.max(0, c.quantity + delta * step);
        return { ...c, quantity: newQty, subtotal: newQty * price };
      }
      return c;
    }).filter(c => c.quantity > 0));
  };

  const createSale = async (): Promise<boolean> => {
    if (cart.length === 0 || !paymentMethod) return false;
    const itemsSold = cart.map(c => ({ item_id: c.item.id, sku: c.item.sku, name: c.item.name, qty_grams: c.quantity, price: c.subtotal }));
    const saleData = {
      sale_date: new Date().toISOString(), items_sold: itemsSold, subtotal_crc: rawTotal,
      discount_crc: rawTotal - finalTotal, tax_crc: 0, total_crc: finalTotal, payment_method: paymentMethod, payment_status: 'completed',
      notes: null, receipt_sent: false, receipt_email: null, created_by_user_id: null,
      server_created_at: new Date().toISOString(), last_modified_at: new Date().toISOString()
    };

    if (isOnline) {
      try {
        const { error } = await supabase.from('sales').insert(saleData);
        if (error) throw error;
        setCart([]); setShowCheckout(false); setPaymentMethod(''); setDiscountPercent(0); setDiscountOverride(null);
        await fetchData();
        return true;
      } catch (err) { console.error('Online sale failed:', err); }
    }
    try {
      const pending = JSON.parse(localStorage.getItem(PENDING_SALES_KEY) || '[]');
      pending.push(saleData);
      localStorage.setItem(PENDING_SALES_KEY, JSON.stringify(pending));
      setCart([]); setShowCheckout(false); setPaymentMethod(''); setDiscountPercent(0); setDiscountOverride(null);
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
      setNewItem({ name: '', sku: '', price_crc: 0, suggested_price_crc: 0, cost_per_gram: 0, current_weight_grams: 0, min_threshold_grams: 100, category_id: '', subcategory_id: '', description: '', image_url: '' });
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

  const rawTotal = cart.reduce((sum, c) => sum + c.subtotal, 0);
  const discountAmount = discountPercent > 0 ? (rawTotal * discountPercent / 100) : 0;
  const finalTotal = discountOverride !== null ? discountOverride : rawTotal - discountAmount;
  const cartTotal = finalTotal;
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
<Typography variant="h5" sx={{ mb: 2, color: COLORS.darkText }}>Bienvenido a CrystalPOS / Welcome to CrystalPOS</Typography>
          <Typography sx={{ mb: 2, color: COLORS.lightText }}>Nombre este iPad / Name this iPad:</Typography>
          <TextField fullWidth label="Nombre del Dispositivo / Device Name" placeholder="Mercado #1 / Market #1" value={deviceName} onChange={(e) => setDeviceName(e.target.value)} sx={{ mb: 2 }} />
          <Button variant="contained" fullWidth onClick={handleNameSubmit}>Continuar / Continue</Button>
    </Box>
  );

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;

  return (
    <>
      <style>{crystalTheme}</style>
      <Box className="crystal-bg" sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" sx={{ bgcolor: COLORS.primary }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flex: 1, fontFamily: "'Brush Script MT', 'Brush Script Std', 'Lucida Calligraphy', 'Lucida Handwriting', cursive", fontSize: '1.8rem', fontWeight: 'bold', color: '#D4AF37', textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>Crystales Tati</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {!isOnline && <WifiOff color="warning" />}
            {syncing && <Sync className="spin" />}
            <Tooltip title={manualSlideshow ? "Detener presentación" : "Iniciar presentación"} arrow>
              <IconButton 
                onClick={toggleSlideshow}
                sx={{ color: manualSlideshow ? '#D4AF37' : 'white' }}
              >
                {manualSlideshow ? <Pause /> : <PlayArrow />}
              </IconButton>
            </Tooltip>
            <Button 
              size="small" 
              variant="outlined"
              onClick={async () => {
                if (!isOnline) { alert('Sin conexión / No internet'); return; }
                setSyncing(true);
                try {
                  await syncPendingSales();
                  await fetchData();
                  alert('Sincronizado / Synced!');
                } catch (e) { alert('Error de sincronización / Sync error'); }
                finally { setSyncing(false); }
              }}
              sx={{ color: '#D4AF37', borderColor: '#D4AF37', fontSize: '0.7rem', py: 0.5, px: 1, minWidth: 'auto' }}
            >
              SYNC
            </Button>
            <Badge badgeContent={cartCount} color="secondary"><ShoppingCart /></Badge>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {/* GALLERY VIEW - Full screen carousel for visual advertising */}
        {currentView === 'gallery' && sortedItems.length > 0 && (
          <Box 
            ref={carouselRef}
            onTouchStart={() => resetIdleTimer()}
            onTouchEnd={() => resetIdleTimer()}
            sx={{ 
              position: 'relative', 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              touchAction: 'pan-y',
              pb: 8
            }}
          >
            {/* Main Image Carousel - FULL SCREEN */}
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', px: 1 }}>
              {/* Left Arrow */}
              <IconButton 
                onClick={() => handleGallerySwipe('prev')}
                sx={{ 
                  position: 'absolute', 
                  left: 5, 
                  zIndex: 10, 
                  bgcolor: 'rgba(255,255,255,0.2)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.4)' }
                }}
              >
                <ChevronLeft sx={{ fontSize: 50, color: 'white' }} />
              </IconButton>

              {/* Item Card - FULL SCREEN */}
              <Box 
                onClick={() => handleGalleryTap(sortedItems[galleryIndex])}
                onDoubleClick={() => handleGalleryTap(sortedItems[galleryIndex])}
                sx={{ 
                  width: '100%', 
                  maxWidth: '90vw',
                  height: '100%',
                  textAlign: 'center',
                  cursor: 'pointer',
                  animation: isIdle ? 'pulse 3s infinite' : 'none',
                  '@keyframes pulse': {
                    '0%, 100%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.01)' }
                  }
                }}
              >
                {/* Image - ALMOST FULL SCREEN */}
                <Box sx={{ 
                  width: '100%', 
                  height: '70vh', 
                  bgcolor: 'rgba(255,255,255,0.05)',
                  borderRadius: 3,
                  overflow: 'hidden',
                  border: '2px solid rgba(212, 175, 55, 0.3)',
                  mb: 2
                }}>
                  {sortedItems[galleryIndex].image_url ? (
                    <img 
                      src={sortedItems[galleryIndex].image_url} 
                      alt={sortedItems[galleryIndex].name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '6rem' }}>💎</Typography>
                    </Box>
                  )}
                </Box>
                
                <Typography variant="h4" sx={{ color: '#D4AF37', fontWeight: 'bold', mb: 0.5, textShadow: '0 0 10px rgba(0,0,0,0.7)' }}>
                  {sortedItems[galleryIndex].name}
                </Typography>
                {(sortedItems[galleryIndex] as any).name_es && (
                  <Typography variant="h5" sx={{ color: 'rgba(255,255,255,0.9)', mb: 1 }}>
                    {(sortedItems[galleryIndex] as any).name_es}
                  </Typography>
                )}
                <Typography variant="h3" sx={{ color: '#fff', fontWeight: 'bold', mb: 0.5, textShadow: '0 0 15px rgba(0,0,0,0.5)' }}>
                  {isFixedPrice(sortedItems[galleryIndex]) 
                    ? formatCurrency(getDisplayPrice(sortedItems[galleryIndex]))
                    : `${formatCurrency(getDisplayPrice(sortedItems[galleryIndex]))}/g`
                  }
                </Typography>
                <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  {isFixedPrice(sortedItems[galleryIndex])
                    ? `📦 ${sortedItems[galleryIndex].current_weight_grams > 0 ? sortedItems[galleryIndex].current_weight_grams + 'g disponible' : 'Sin stock'}`
                    : `📦 ${sortedItems[galleryIndex].current_weight_grams}g disponibles`
                  }
                </Typography>
              </Box>

              {/* Right Arrow */}
              <IconButton 
                onClick={() => handleGallerySwipe('next')}
                sx={{ 
                  position: 'absolute', 
                  right: 5, 
                  zIndex: 10, 
                  bgcolor: 'rgba(255,255,255,0.2)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.4)' }
                }}
              >
                <ChevronRight sx={{ fontSize: 50, color: 'white' }} />
              </IconButton>
            </Box>

            {/* Dot Indicators */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 1, flexWrap: 'wrap', px: 2 }}>
              {sortedItems.slice(0, 10).map((_, idx) => (
                <Box 
                  key={idx}
                  onClick={() => { resetIdleTimer(); setGalleryIndex(idx); }}
                  sx={{ 
                    width: idx === galleryIndex ? 24 : 10, 
                    height: 10, 
                    borderRadius: 5, 
                    bgcolor: idx === galleryIndex ? '#D4AF37' : 'rgba(255,255,255,0.3)',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {currentView === 'sales' && (
          <>
            <TextField fullWidth size="small" placeholder="Buscar items..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} sx={{ mb: 1, bgcolor: 'white' }} />
            <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
              <Button size="small" variant={selectedCategory === 'all' ? 'contained' : 'outlined'} onClick={() => { setSelectedCategory('all'); setSelectedSubcategory('all'); }}>Todos</Button>
              {categories.map(cat => {
                const displayName = (cat as any).name_es ? (cat.name.includes('/') ? cat.name : `${cat.name} / ${(cat as any).name_es}`) : cat.name;
                return (
                  <Button key={cat.id} size="small" variant={selectedCategory === cat.id ? 'contained' : 'outlined'} onClick={() => { setSelectedCategory(cat.id); setSelectedSubcategory('all'); }}>{displayName}</Button>
                );
              })}
            </Box>
            {selectedCategory !== 'all' && getSubcategoriesForCategory(selectedCategory).length > 0 && (
              <Box sx={{ display: 'flex', gap: 0.5, overflowX: 'auto', pb: 1, ml: 1 }}>
                <Button size="small" variant={selectedSubcategory === 'all' ? 'contained' : 'outlined'} onClick={() => setSelectedSubcategory('all')}>Todos</Button>
                {getSubcategoriesForCategory(selectedCategory).map(sub => {
                  const subDisplay = (sub as any).name_es ? (sub.name.includes('/') ? sub.name : `${sub.name} / ${(sub as any).name_es}`) : sub.name;
                  return (
                    <Button key={sub.id} size="small" variant={selectedSubcategory === sub.id ? 'contained' : 'outlined'} onClick={() => setSelectedSubcategory(sub.id)}>{subDisplay}</Button>
                  );
                })}
              </Box>
            )}
            <Grid container spacing={1.5}>
              {filteredItems.map(item => (
                <Grid size={{ xs: 6, sm: 4, md: 3 }} key={item.id}>
                  <Card sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'grey.50' } }} onClick={() => addToCart(item)}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      {item.image_url && <Box sx={{ width: '100%', height: 60, bgcolor: 'grey.200', borderRadius: 1, mb: 1 }}><img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></Box>}
                      <Typography sx={{ fontWeight: 'bold', fontSize: '0.9rem', color: COLORS.darkText }} noWrap>{item.name}</Typography>
                      <Typography sx={{ color: COLORS.primary, fontWeight: 'bold' }}>
                        {isFixedPrice(item) ? formatCurrency(getDisplayPrice(item)) : `${formatCurrency(getDisplayPrice(item))}/g`}
                      </Typography>
                      <Typography variant="caption" sx={{ color: COLORS.lightText }}>
                        {item.current_weight_grams > 0 ? item.current_weight_grams + 'g' : '(sin stock)'}
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
            <Typography variant="h6" sx={{ mb: 2, color: COLORS.darkText }}>Inventario / Inventory ({items.length})</Typography>
            <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label="🔴 Crítico / Critical (<30 días/days)" sx={{ bgcolor: COLORS.error, color: 'white' }} size="small" />
              <Chip label="🟠 Alerta / Warning (<60 días/days)" sx={{ bgcolor: COLORS.warning, color: 'white' }} size="small" />
              <Chip label="🟢 Bueno / Good" sx={{ bgcolor: COLORS.success, color: 'white' }} size="small" />
              <Chip label="⚫ Agotado / Out of Stock" sx={{ bgcolor: '#333', color: 'white' }} size="small" />
            </Box>
            <Paper>
              <List>
                {items.slice(0, 50).map(item => {
                  const warning = getStockWarning(item);
                  const bgColor = warning.level === 'critical' ? COLORS.error : warning.level === 'warning' ? COLORS.warning : warning.level === 'out' ? '#333' : 'transparent';
                  const textColor = warning.level === 'out' ? 'white' : COLORS.darkText;
                  return (
                    <ListItem key={item.id} sx={{ bgcolor: bgColor, borderRadius: 1, mb: 0.5, mx: 1 }}>
                      <ListItemText 
                        primary={
                          <Typography sx={{ color: textColor, fontWeight: warning.level !== 'none' ? 'bold' : 'normal' }}>
                            {item.name}
                          </Typography>
                        } 
                        secondary={
                          <Typography sx={{ color: textColor, opacity: 0.9 }}>
                            {item.current_weight_grams}g | {formatCurrency(Number(item.price_crc))}
                            {warning.level !== 'none' && ` | ${warning.message}`}
                          </Typography>
                        } 
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Paper>
          </Box>
        )}

        {currentView === 'add' && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, color: COLORS.darkText }}>Gestionar Inventario / Manage Inventory</Typography>
            <Button variant="contained" startIcon={<Add />} onClick={() => setShowAddItem(true)} sx={{ mr: 1, bgcolor: COLORS.primary }}>Agregar Item / Add Item</Button>
            <Button variant="outlined" startIcon={<Add />} onClick={() => setShowAddCategory(true)}>Agregar Categoría / Add Category</Button>
          </Box>
        )}

        {currentView === 'dashboard' && (
          <Box sx={{ textAlign: 'center', py: 4, color: COLORS.darkText }}>
            <Typography variant="h5" sx={{ mb: 1, color: COLORS.darkText }}>Crystales Tati</Typography>
            <Typography sx={{ color: COLORS.lightText, mb: 2 }}>POS Manager de Ventas / Vendor Manager POS</Typography>
            <Divider sx={{ my: 2 }} />
            <Typography sx={{ color: COLORS.darkText }}>Dispositivo / Device: {localStorage.getItem('crystalpos_device_name') || 'Sin Nombre / Unnamed'}</Typography>
            <Typography sx={{ color: COLORS.darkText }}>Estado / Status: {isOnline ? 'En Línea / Online' : 'Sin Conexión / Offline'}</Typography>
            <Typography sx={{ color: COLORS.darkText }}>Última Sincronización / Last Sync: {lastSync ? new Date(lastSync).toLocaleString() : 'Nunca / Never'}</Typography>
            <Typography sx={{ color: COLORS.darkText }}>Items: {items.length}</Typography>
          </Box>
        )}
      </Box>

      {cart.length > 0 && !showCheckout && (
        <Paper sx={{ p: 2, borderTop: '2px solid', borderColor: COLORS.primary }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="h6" sx={{ color: COLORS.darkText }}>{cartCount} artículos / items</Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: COLORS.primary }}>{formatCurrency(cartTotal)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" color="error" size="small" startIcon={<Delete />} onClick={() => setCart([])}>Limpiar / Clear</Button>
            <Button variant="contained" color="success" size="small" startIcon={<Payment />} fullWidth onClick={() => setShowCheckout(true)}>Pagar / Checkout</Button>
          </Box>
        </Paper>
      )}

      {/* DETAIL MODAL - Add item with custom weight */}
      <Dialog open={showDetailModal} onClose={() => setShowDetailModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: COLORS.darkText, textAlign: 'center' }}>
          {detailItem?.name}
        </DialogTitle>
        <DialogContent>
          {/* Large Image */}
          <Box sx={{ width: '100%', height: 200, bgcolor: 'grey.200', borderRadius: 2, mb: 2, overflow: 'hidden' }}>
            {detailItem?.image_url ? (
              <img src={detailItem.image_url} alt={detailItem.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>💎</Box>
            )}
          </Box>

          <Typography variant="body2" sx={{ color: COLORS.lightText, mb: 2, textAlign: 'center' }}>
            {detailItem?.description}
          </Typography>

          {detailItem && isFixedPrice(detailItem) ? (
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="h5" sx={{ color: COLORS.primary, fontWeight: 'bold', mb: 1 }}>
                Precio: {formatCurrency(getDisplayPrice(detailItem))}
              </Typography>
              <Typography variant="body2" sx={{ color: COLORS.lightText }}>
                {detailItem.current_weight_grams > 0 ? `Stock: ${detailItem.current_weight_grams}g` : 'Sin stock'}
              </Typography>
            </Box>
          ) : (
            <>
              <Tooltip title="Ingresa el peso en gramos">
                <TextField
                  fullWidth
                  label="Peso (gramos)"
                  type="number"
                  value={detailWeight}
                  onChange={(e) => setDetailWeight(Number(e.target.value))}
                  sx={{ mb: 2, bgcolor: 'white' }}
                />
              </Tooltip>

              <Typography variant="h6" sx={{ color: COLORS.darkText, mb: 1, textAlign: 'center' }}>
                Precio automático: {formatCurrency(Number(detailItem?.price_crc || 0) * detailWeight)}
              </Typography>
            </>
          )}

          <Tooltip title="Deja vacío para precio automático, o ingresa precio final">
            <TextField
              fullWidth
              label="O precio final (override)"
              type="number"
              value={detailFinalPrice !== null ? detailFinalPrice : ''}
              placeholder="Precio manual"
              onChange={(e) => setDetailFinalPrice(e.target.value ? Number(e.target.value) : null)}
              sx={{ mb: 2, bgcolor: 'white' }}
            />
          </Tooltip>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button onClick={() => setShowDetailModal(false)} variant="outlined">Cancelar</Button>
          <Button onClick={addFromDetail} variant="contained" color="success" sx={{ bgcolor: COLORS.success }}>
            Añadir al Carrito
          </Button>
        </DialogActions>
      </Dialog>

      {showCheckout && (
        <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <Paper sx={{ p: 3, m: 2, maxWidth: 400, width: '100%', bgcolor: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" sx={{ color: COLORS.darkText }}>Pago / Checkout</Typography>
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography sx={{ color: COLORS.lightText }}>Subtotal:</Typography>
              <Typography sx={{ color: COLORS.darkText, fontWeight: 'bold' }}>{formatCurrency(rawTotal)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography sx={{ color: COLORS.lightText }}>Descuento / Discount (%):</Typography>
              <TextField 
                type="number" 
                size="small" 
                value={discountPercent} 
                onChange={(e) => { setDiscountPercent(Number(e.target.value)); setDiscountOverride(null); }}
                sx={{ width: 60, bgcolor: 'white' }}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography sx={{ color: COLORS.lightText }}>O precio final / Or final price:</Typography>
              <TextField 
                type="number" 
                size="small" 
                value={discountOverride !== null ? discountOverride : ''} 
                placeholder={formatCurrency(rawTotal)}
                onChange={(e) => setDiscountOverride(e.target.value ? Number(e.target.value) : null)}
                sx={{ width: 100, bgcolor: 'white' }}
              />
            </Box>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ mb: 2, color: COLORS.darkText, fontWeight: 'bold' }}>Total: {formatCurrency(finalTotal)}</Typography>

            <Typography sx={{ mb: 1, color: COLORS.lightText }}>Método de Pago / Payment Method:</Typography>
            <FormControl fullWidth>
              <RadioGroup row value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
                <FormControlLabel value="cash" control={<Radio />} label={<Typography sx={{ color: COLORS.darkText }}>Efectivo / Cash</Typography>} />
                <FormControlLabel value="sinpe" control={<Radio />} label={<Typography sx={{ color: COLORS.darkText }}>SINPE</Typography>} />
                <FormControlLabel value="card" control={<Radio />} label={<Typography sx={{ color: COLORS.darkText }}>Tarjeta / Card</Typography>} />
              </RadioGroup>
            </FormControl>
            <Button variant="contained" color="success" fullWidth size="large" disabled={!paymentMethod || processing} onClick={handleCheckout} sx={{ bgcolor: COLORS.success }}>
              {processing ? 'Procesando / Processing...' : 'Completar Venta / Complete Sale'}
            </Button>
            {!isOnline && <Typography variant="caption" sx={{ color: COLORS.lightText, display: 'block', mt: 1 }}>Sin Conexión - Se sincronizará cuando esté en línea / Offline - Will sync when online</Typography>}
          </Paper>
        </Box>
      )}

      {/* ADD ITEM DIALOG */}
      <Dialog open={showAddItem} onClose={() => setShowAddItem(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: COLORS.darkText }}>Agregar Nuevo Item / Add New Item</DialogTitle>
        <DialogContent>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} style={{ display: 'none' }} />
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Button variant="outlined" startIcon={<CameraAlt />} onClick={handleImageSelect}>Tomar Foto / Take Photo</Button>
          </Box>
          {newItem.image_url && <Box sx={{ width: '100%', height: 150, bgcolor: 'grey.200', borderRadius: 1, mb: 2 }}><img src={newItem.image_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></Box>}
          <TextField fullWidth label="Nombre del Item / Item Name *" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} sx={{ mb: 2, bgcolor: 'white' }} />
          <TextField fullWidth label="SKU (o deja vacío/leave empty)" value={newItem.sku} onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })} sx={{ mb: 2, bgcolor: 'white' }} placeholder="Opcional / Optional" />
          <TextField fullWidth label="Costo por gramo / Cost per gram (CRC)" type="number" value={newItem.cost_per_gram} onChange={(e) => setNewItem({ ...newItem, cost_per_gram: Number(e.target.value) })} sx={{ mb: 2, bgcolor: 'white' }} />
          <TextField fullWidth label="Precio Sugerido por g / Suggested Price/g (CRC)" type="number" value={newItem.suggested_price_crc} onChange={(e) => setNewItem({ ...newItem, suggested_price_crc: Number(e.target.value) })} sx={{ mb: 2, bgcolor: 'white' }} />
          <TextField fullWidth label="Precio Venta por g / Price (CRC)/g *" type="number" value={newItem.price_crc} onChange={(e) => setNewItem({ ...newItem, price_crc: Number(e.target.value) })} sx={{ mb: 2, bgcolor: 'white' }} />
          <TextField fullWidth label="Stock actual (gramos) / Stock (grams)" type="number" value={newItem.current_weight_grams} onChange={(e) => setNewItem({ ...newItem, current_weight_grams: Number(e.target.value) })} sx={{ mb: 2, bgcolor: 'white' }} />
          <TextField fullWidth label="Mín stock alerta / Min stock threshold (g)" type="number" value={newItem.min_threshold_grams} onChange={(e) => setNewItem({ ...newItem, min_threshold_grams: Number(e.target.value) })} sx={{ mb: 2, bgcolor: 'white' }} />
          <FormControl fullWidth sx={{ mb: 2, bgcolor: 'white' }}>
<InputLabel>Categoría / Category *</InputLabel>
            <Select value={newItem.category_id} label="Categoría / Category *" onChange={(e) => setNewItem({ ...newItem, category_id: e.target.value })}>
              {categories.map(cat => <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Subcategoría / Subcategory</InputLabel>
            <Select value={newItem.subcategory_id} label="Subcategoría / Subcategory" onChange={(e) => setNewItem({ ...newItem, subcategory_id: e.target.value })}>
              <MenuItem value="">Ninguno / None</MenuItem>
              {newItem.category_id && getSubcategoriesForCategory(newItem.category_id).map(sub => <MenuItem key={sub.id} value={sub.id}>{sub.name}</MenuItem>)}
            </Select>
          </FormControl>
<TextField fullWidth label="Descripción / Description" value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} multiline rows={2} sx={{ bgcolor: 'white' }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddItem(false)}>Cancelar / Cancel</Button>
          <Button variant="contained" onClick={handleSaveItem} disabled={savingItem} sx={{ bgcolor: COLORS.primary }}>{savingItem ? 'Guardando / Saving...' : 'Guardar Item / Save Item'}</Button>
        </DialogActions>
      </Dialog>

      {/* ADD CATEGORY DIALOG */}
<Dialog open={showAddCategory} onClose={() => setShowAddCategory(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: COLORS.darkText }}>Agregar Categoría / Add Category</DialogTitle>
        <DialogContent>
          <Typography variant="h6" sx={{ mb: 2, color: COLORS.darkText }}>Nueva Categoría / New Category</Typography>
          <TextField fullWidth label="Nombre de Categoría / Category Name" value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} sx={{ mb: 2, bgcolor: 'white' }} />
          <TextField fullWidth label="Descripción / Description" value={newCategory.description} onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })} sx={{ mb: 3, bgcolor: 'white' }} />

          <Typography variant="h6" sx={{ mb: 2, color: COLORS.darkText }}>Nueva Subcategoría / New Subcategory</Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Categoría Principal / Parent Category</InputLabel>
            <Select value={newSubcategory.category_id} label="Categoría Principal / Parent Category" onChange={(e) => setNewSubcategory({ ...newSubcategory, category_id: e.target.value })}>
              {categories.map(cat => <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField fullWidth label="Nombre de Subcategoría / Subcategory Name" value={newSubcategory.name} onChange={(e) => setNewSubcategory({ ...newSubcategory, name: e.target.value })} sx={{ mb: 2, bgcolor: 'white' }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddCategory(false)}>Cerrar / Close</Button>
        </DialogActions>
      </Dialog>

      <BottomNavigation value={currentView} onChange={(_, v) => { setCurrentView(v); resetIdleTimer(); }} sx={{ bgcolor: 'white' }}>
        <BottomNavigationAction value="gallery" label="Galería" icon={<CollectionsBookmark />} />
        <BottomNavigationAction value="sales" label="Ventas" icon={<ShoppingCart />} />
        <BottomNavigationAction value="inventory" label="Inventario" icon={<InventoryIcon />} />
        <BottomNavigationAction value="add" label="Agregar" icon={<Add />} />
        <BottomNavigationAction value="dashboard" label="Ajustes" icon={<DashboardIcon />} />
      </BottomNavigation>
    </Box>
    </>
  );
}