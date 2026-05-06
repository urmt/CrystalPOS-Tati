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
  DialogContent, DialogActions, Select, MenuItem, InputLabel, Chip, Tooltip, Checkbox
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { 
  ShoppingCart, Inventory as InventoryIcon, Dashboard as DashboardIcon,
  Settings, Delete, Payment, WifiOff, Sync, Add, CameraAlt, Close,
  ChevronLeft, ChevronRight, Home, Image, PlayArrow, Pause, Remove
} from '@mui/icons-material';
import { supabase } from '@/lib/supabase';
import { logErrorAndAlert } from '@/lib/telegram';
import { Item, Category as CategoryType, Subcategory, Todo } from '@/types';
import { formatCurrency } from '@/utils/format';

const COLORS = {
  primary: '#6B4C9A',
  primaryDark: '#4a3570',
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
  itemDiscount?: number;
  manualPrice?: number | null;
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
type POSView = 'sales' | 'inventory' | 'add' | 'dashboard' | 'gallery' | 'cart' | 'todo';

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
name: '', sku: '', price_crc: 0, cost_per_gram: 0,
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
  const startSlideshowRef = useRef<() => void>(() => {});
  const stopSlideshowRef = useRef<() => void>(() => {});
  const galleryNavigatingRef = useRef(false);
  
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [isIdle, setIsIdle] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailItem, setDetailItem] = useState<Item | null>(null);
  const [detailWeight, setDetailWeight] = useState(100);
  const [detailFinalPrice, setDetailFinalPrice] = useState<number | null>(null);
  const [showHelpTooltips, setShowHelpTooltips] = useState(true);
  const [manualSlideshow, setManualSlideshow] = useState(false);
  
  // Gram input modal for per-gram items
  const [showGramModal, setShowGramModal] = useState(false);
  const [gramItem, setGramItem] = useState<Item | null>(null);
  const [gramQty, setGramQty] = useState(0);
  
  // Number pad modal for price entry
  const [showNumberPad, setShowNumberPad] = useState(false);
  const [numberPadItemIdx, setNumberPadItemIdx] = useState<number | null>(null);
  const [numberPadValue, setNumberPadValue] = useState('');
  
  // Customer info for WhatsApp receipt
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [countryCode, setCountryCode] = useState('+506');
  const [wantReceipt, setWantReceipt] = useState(false);
  
  // Online/Offline mode toggle
  const [offlineMode, setOfflineMode] = useState(false);
  
  // Payment settings from admin
  const [paymentSettings, setPaymentSettings] = useState({
    cash_enabled: true,
    sinpe_enabled: true,
    card_enabled: true,
    lightning_enabled: false
  });
  
  // Business name from settings (loaded on sync)
  const [businessName, setBusinessName] = useState('Cristales Despertar');
  
  // Today's sales stats
  const [todaySalesCount, setTodaySalesCount] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [todayItemsSold, setTodayItemsSold] = useState(0);
  
  // TODOs
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoText, setNewTodoText] = useState('');
  const [newTodoImage, setNewTodoImage] = useState<string | null>(null);
  const todoImageInputRef = useRef<HTMLInputElement>(null);

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
        await fetchTodaySales();
      } else { loadOfflineData(); }
    };
    init();
  }, [isOnline, loadOfflineData]);

  // Fetch today's sales stats
  const fetchTodaySales = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('sales')
        .select('total_crc, items_sold')
        .gte('created_at', today);
      
      if (data) {
        const count = data.length;
        const revenue = data.reduce((sum, s) => sum + (s.total_crc || 0), 0);
        const items = data.reduce((sum, s) => {
          if (s.items_sold) {
            return sum + s.items_sold.reduce((is: number, item: any) => is + (item.qty_grams || 0), 0);
          }
          return sum;
        }, 0);
        setTodaySalesCount(count);
        setTodayRevenue(revenue);
        setTodayItemsSold(items);
      }
    } catch (err) { console.error('Error fetching today sales:', err); }
  };

  // Load payment settings
  useEffect(() => {
    const loadPaymentSettings = async () => {
      try {
        const { data } = await supabase.from('app_settings').select('setting_value').eq('setting_key', 'payments').single();
        if (data?.setting_value) setPaymentSettings(data.setting_value);
      } catch (e) { console.log('Using default payment settings'); }
    };
    loadPaymentSettings();
  }, []);

  // Load business name from settings
  const [businessNameSize, setBusinessNameSize] = useState('normal');
  const loadBusinessName = useCallback(async () => {
    try {
      const { data } = await supabase.from('app_settings').select('setting_value').eq('setting_key', 'business').single();
      if (data?.setting_value?.business_name) {
        setBusinessName(data.setting_value.business_name);
        localStorage.setItem('crystalpos_business_name', data.setting_value.business_name);
      }
      if (data?.setting_value?.business_name_size) {
        setBusinessNameSize(data.setting_value.business_name_size);
        localStorage.setItem('crystalpos_business_name_size', data.setting_value.business_name_size);
      }
    } catch (e) { console.log('Using default business name'); }
  }, []);

  // Load from localStorage on mount (for offline)
  useEffect(() => {
    const stored = localStorage.getItem('crystalpos_business_name');
    const storedSize = localStorage.getItem('crystalpos_business_name_size');
    if (stored) setBusinessName(stored);
    if (storedSize) setBusinessNameSize(storedSize);
  }, []);

  // Load todos
  useEffect(() => {
    const loadTodos = async () => {
      const { data } = await supabase.from('todos').select('*').order('created_at', { ascending: false });
      if (data) setTodos(data as Todo[]);
    };
    loadTodos();
  }, []);

  // Start idle timer after initial render (runs once)
  useEffect(() => {
    const timerId = setTimeout(() => {
      const maxItems = Math.min(items.length, 10);
      if (maxItems > 0) {
        setCurrentView('gallery');
        setIsIdle(true);
        if (slideIntervalRef.current) clearInterval(slideIntervalRef.current);
        slideIntervalRef.current = setInterval(() => {
          setGalleryIndex(prev => (prev + 1) % maxItems);
        }, 6000);
      }
    }, 60000);
    return () => clearTimeout(timerId);
  }, [items.length]);

  // =============================================================================
  // Helper: Start slideshow (called by idle timer OR manual PLAY button)
  // =============================================================================
  const startSlideshow = useCallback(() => {
    const maxItems = Math.min(items.length, 10);
    if (maxItems > 0) {
      if (slideIntervalRef.current) clearInterval(slideIntervalRef.current);
      slideIntervalRef.current = setInterval(() => {
        setGalleryIndex(prev => (prev + 1) % maxItems);
      }, 6000);
    }
  }, [items.length]);

  // =============================================================================
  // Helper: Stop slideshow
  // =============================================================================
  const stopSlideshow = useCallback(() => {
    if (slideIntervalRef.current) {
      clearInterval(slideIntervalRef.current);
      slideIntervalRef.current = null;
    }
  }, []);

  // Reset idle timer on user interaction
  const resetIdleTimer = useCallback(() => {
    if (manualSlideshow) return; // Don't reset if slideshow running manually
    setIsIdle(false);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setCurrentView('gallery');
      setIsIdle(true);
      startSlideshow();
    }, 60000);
  }, [manualSlideshow, startSlideshow]);

  // Toggle slideshow manually (PLAY button)
  const toggleSlideshow = useCallback(() => {
    if (manualSlideshow) {
      setManualSlideshow(false);
      setIsIdle(false);
      stopSlideshow();
    } else {
      setCurrentView('gallery');
      setManualSlideshow(true);
      setIsIdle(true);
      startSlideshow();
    }
  }, [manualSlideshow, startSlideshow, stopSlideshow]);

  // Attach global event listeners for idle detection
  useEffect(() => {
    const handleInteraction = () => {
      // Only reset idle timer, don't touch slideshow
      if (manualSlideshow) return;
      setIsIdle(false);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        setCurrentView('gallery');
        setIsIdle(true);
        startSlideshow();
      }, 60000);
    };
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page hidden - clear any existing timer
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      } else {
        // Page visible - start idle timer
        handleInteraction();
      }
    };
    
    const events = ['touchstart', 'touchmove', 'touchend', 'click', 'scroll', 'keydown'];
    events.forEach(event => document.addEventListener(event, handleInteraction));
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      events.forEach(event => document.removeEventListener(event, handleInteraction));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [manualSlideshow, startSlideshow]);

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
  if (!items.length || sortedItems.length < 2) return;
  if (galleryNavigatingRef.current) return;
  galleryNavigatingRef.current = true;
  resetIdleTimer();
  if (direction === 'next') {
    setGalleryIndex((galleryIndex + 1) % sortedItems.length);
  } else {
    setGalleryIndex((galleryIndex - 1 + sortedItems.length) % sortedItems.length);
  }
  setTimeout(() => { galleryNavigatingRef.current = false; }, 700);
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
    if (isFixedPrice(item)) {
      // Fixed price - add directly
      const existing = cart.find(c => c.item.id === item.id);
      const price = getDisplayPrice(item);
      if (existing) {
        const newQty = existing.quantity + 1;
        setCart(cart.map(c => c.item.id === item.id ? { ...c, quantity: newQty, subtotal: newQty * price } : c));
      } else {
        setCart([...cart, { item, quantity: 1, subtotal: price }]);
      }
    } else {
      // Per-gram - open gram input modal
      setGramItem(item);
      setGramQty(0);
      setShowGramModal(true);
    }
  };
  
  // Add from gram modal
  const addGramToCart = () => {
    if (!gramItem || gramQty <= 0) return;
    const existing = cart.find(c => c.item.id === gramItem.id);
    const pricePerGram = Number(gramItem.price_crc);
    const totalPrice = pricePerGram * gramQty;
    
    if (existing) {
      const newQty = existing.quantity + gramQty;
      setCart(cart.map(c => c.item.id === gramItem.id ? { ...c, quantity: newQty, subtotal: newQty * pricePerGram } : c));
    } else {
      setCart([...cart, { item: gramItem, quantity: gramQty, subtotal: totalPrice }]);
    }
    setShowGramModal(false);
    setGramItem(null);
    setGramQty(0);
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
    const fullPhone = countryCode.replace('__OTHER_', '') + customerPhone;
    const saleData = {
      sale_date: new Date().toISOString(), items_sold: itemsSold, subtotal_crc: rawTotal,
      discount_crc: rawTotal - finalTotal, tax_crc: 0, total_crc: finalTotal, payment_method: paymentMethod, payment_status: 'completed',
      notes: null, receipt_sent: false, receipt_email: null, 
      customer_phone: wantReceipt ? fullPhone : null,
      customer_name: wantReceipt ? customerName : null,
      created_by_user_id: null,
      server_created_at: new Date().toISOString(), last_modified_at: new Date().toISOString()
    };

    const isOffline = offlineMode || !isOnline;
    
    if (!isOffline) {
      console.log('CREATE SALE: Starting - wantReceipt=', wantReceipt, 'countryCode=', countryCode);
      try {
        // Save/update customer if they want receipt
        if (wantReceipt && fullPhone && customerPhone) {
          console.log('CREATE SALE: Saving customer - phone=', customerPhone, 'name=', customerName);
          // Check if customer exists
          const { data: existing, error: custError } = await supabase
            .from('customers')
            .select('id, total_purchases, purchase_count')
            .eq('phone', customerPhone)
            .eq('country_code', countryCode.replace('__OTHER_', ''))
            .single();
          
          console.log('CREATE SALE: Customer lookup result - data=', existing, 'error=', custError);
          
          if (existing && existing.id) {
            console.log('CREATE SALE: Updating existing customer');
            // Update existing customer
            await supabase.from('customers').update({
              total_purchases: (existing.total_purchases || 0) + finalTotal,
              purchase_count: (existing.purchase_count || 0) + 1,
              last_purchase: new Date().toISOString().split('T')[0],
              name: customerName || undefined
            }).eq('id', existing.id);
          } else {
            console.log('CREATE SALE: Inserting new customer');
            // Insert new customer
            const { error: insertError } = await supabase.from('customers').insert({
              phone: customerPhone,
              country_code: countryCode.replace('__OTHER_', ''),
              name: customerName || null,
              total_purchases: finalTotal,
              purchase_count: 1,
              last_purchase: new Date().toISOString().split('T')[0]
            });
            console.log('CREATE SALE: Insert result error=', insertError);
          }
        }

        const { error } = await supabase.from('sales').insert(saleData);
        if (error) throw error;
        console.log('CREATE SALE: Sale saved successfully');
        
        // Reset after successful sale
        setCart([]); setShowCheckout(false); setPaymentMethod(''); setDiscountPercent(0); setDiscountOverride(null);
        setCustomerPhone(''); setCustomerName(''); setWantReceipt(false);
        await fetchData();
        return true;
      } catch (err) { console.error('Online sale failed:', err); }
    }
    if (isOffline) {
      try {
        const pending = JSON.parse(localStorage.getItem(PENDING_SALES_KEY) || '[]');
        pending.push({...saleData, _customerWantReceipt: wantReceipt});
        localStorage.setItem(PENDING_SALES_KEY, JSON.stringify(pending));
        setCart([]); setShowCheckout(false); setPaymentMethod(''); setDiscountPercent(0); setDiscountOverride(null);
        setCustomerPhone(''); setCustomerName(''); setWantReceipt(false);
        return true;
      } catch (err) { return false; }
    }
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
      setNewItem({ name: '', sku: '', price_crc: 0, cost_per_gram: 0, current_weight_grams: 0, min_threshold_grams: 100, category_id: '', subcategory_id: '', description: '', image_url: '' });
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

  const rawTotal = cart.reduce((sum, c) => {
    const manualP = (c as any).manualPrice;
    if (manualP) return sum + manualP; // Use manual total directly
    const basePrice = isFixedPrice(c.item) ? getDisplayPrice(c.item) : Number(c.item.price_crc);
    const itemDiscount = (c as any).itemDiscount || 0;
    return sum + (basePrice * c.quantity * (1 - itemDiscount / 100));
  }, 0);
  const cartItemDiscounts = cart.reduce((sum, c) => {
    const basePrice = isFixedPrice(c.item) ? getDisplayPrice(c.item) : Number(c.item.price_crc);
    const unitPrice = (c as any).manualPrice || basePrice;
    const itemDiscount = (c as any).itemDiscount || 0;
    return sum + (unitPrice * c.quantity * (itemDiscount / 100));
  }, 0);
  const discountAmount = (discountPercent > 0 ? (cart.reduce((sum, c) => {
    const basePrice = isFixedPrice(c.item) ? getDisplayPrice(c.item) : Number(c.item.price_crc);
    const unitPrice = (c as any).manualPrice || basePrice;
    return sum + (unitPrice * c.quantity);
  }, 0) * discountPercent / 100) : 0);
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
          <Typography variant="h6" sx={{ flex: 1, fontFamily: "'Brush Script MT', 'Brush Script Std', 'Lucida Calligraphy', 'Lucida Handwriting', cursive", fontSize: businessNameSize === 'small' ? 'max(0.8rem, 2.5vw)' : 'max(1.5rem, 4vw)', fontWeight: 'bold', color: '#D4AF37', textShadow: '1px 1px 2px rgba(0,0,0,0.3)', wordBreak: 'break-word' }}>{businessName}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {offlineMode ? (
              <Chip label="OFFLINE" color="error" size="small" onClick={() => setOfflineMode(false)} clickable sx={{ cursor: 'pointer' }} />
            ) : (
              <Chip label="ONLINE" color="success" size="small" onClick={() => setOfflineMode(true)} clickable sx={{ cursor: 'pointer' }} />
            )}
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
                setSyncing(true);
                try {
                  // Always sync pending sales first
                  await syncPendingSales();
                  await fetchData();
                  
                  // Reload payment settings from database
                  const { data } = await supabase.from('app_settings').select('setting_value').eq('setting_key', 'payments').single();
                  if (data?.setting_value) {
                    setPaymentSettings(data.setting_value);
                  }
                  
                  // Reload business name
                  await loadBusinessName();
                  
                  // Reload todos
                  const { data: todosData } = await supabase.from('todos').select('*').order('created_at', { ascending: false });
                  if (todosData) setTodos(todosData as Todo[]);
                  
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
                  onClick={() => { if (!galleryNavigatingRef.current) { galleryNavigatingRef.current = true; resetIdleTimer(); setGalleryIndex(idx); setTimeout(() => { galleryNavigatingRef.current = false; }, 700); } }}
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
            
            {/* Categories as horizontal scroll */}
            <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
              <Button size="small" variant={selectedCategory === 'all' ? 'contained' : 'outlined'} onClick={() => { setSelectedCategory('all'); setSelectedSubcategory('all'); }}>Todos</Button>
              {categories.map(cat => {
                const displayName = (cat as any).name_es ? (cat.name.includes('/') ? cat.name : `${cat.name} / ${(cat as any).name_es}`) : cat.name;
                return (
                  <Button key={cat.id} size="small" variant={selectedCategory === cat.id ? 'contained' : 'outlined'} onClick={() => { setSelectedCategory(cat.id); setSelectedSubcategory('all'); }}>{displayName}</Button>
                );
              })}
            </Box>
            
            {/* Subcategories as dropdown */}
            {selectedCategory !== 'all' && getSubcategoriesForCategory(selectedCategory).length > 0 && (
              <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                <Select value={selectedSubcategory} onChange={(e) => setSelectedSubcategory(e.target.value)} sx={{ bgcolor: 'white' }}>
                  <MenuItem value="all">Todas las subcategorías</MenuItem>
                  {getSubcategoriesForCategory(selectedCategory).map(sub => {
                    const subDisplay = (sub as any).name_es ? (sub.name.includes('/') ? sub.name : `${sub.name} / ${(sub as any).name_es}`) : sub.name;
                    return (
                      <MenuItem key={sub.id} value={sub.id}>{subDisplay}</MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
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

        {currentView === 'cart' && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, color: COLORS.darkText }}>
              Carrito / Cart ({cart.length} items)
            </Typography>
            
            {cart.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography sx={{ color: COLORS.lightText, mb: 2 }}>El carrito está vacío / Cart is empty</Typography>
                <Button variant="contained" onClick={() => setCurrentView('sales')} sx={{ bgcolor: COLORS.primary }}>
                 .ir a Ventas / Go to Sales
                </Button>
              </Box>
            ) : (
              <>
                <List sx={{ mb: 2 }}>
                  {cart.map((cartItem, idx) => {
                    const isPerGram = !isFixedPrice(cartItem.item);
                    const unitPrice = isPerGram ? Number(cartItem.item.price_crc) : getDisplayPrice(cartItem.item);
                    
                    return (
                      <ListItem key={idx} sx={{ bgcolor: 'white', borderRadius: 1, mb: 1, flexDirection: 'column', alignItems: 'stretch' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 1 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography sx={{ fontWeight: 'bold', fontSize: '1.1rem', color: COLORS.darkText }}>{cartItem.item.name}</Typography>
                            <Typography variant="caption" sx={{ color: COLORS.lightText }}>
                              {isPerGram ? `${formatCurrency(unitPrice)}/g` : formatCurrency(unitPrice)} {isPerGram ? `× ${cartItem.quantity}g` : `× ${cartItem.quantity} unidades`}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography sx={{ fontWeight: 'bold', fontSize: '1.1rem', color: COLORS.primary }}>
                              {formatCurrency(cartItem.subtotal)}
                            </Typography>
                          </Box>
                        </Box>
                        
                        {/* Per-item discount controls */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                          <Typography variant="caption" sx={{ color: COLORS.darkText }}>Desc:</Typography>
                          {[0, 5, 10, 15, 20, 25, 50].map(pct => (
                            <Button 
                              key={pct}
                              size="small"
                              variant={(cartItem as any).itemDiscount === pct || (pct === 0 && !(cartItem as any).itemDiscount) ? 'contained' : 'outlined'}
                              onClick={() => {
                                const newCart = [...cart];
                                newCart[idx] = { ...newCart[idx], itemDiscount: pct };
                                const manualP = (cartItem as any).manualPrice;
                                // If manual price, use that as total; otherwise use calculated
                                const itemTotal = manualP 
                                  ? manualP * (1 - pct / 100)
                                  : unitPrice * cartItem.quantity * (1 - pct / 100);
                                newCart[idx] = { ...newCart[idx], subtotal: itemTotal };
                                setCart(newCart);
                              }}
                              sx={{ minWidth: 35, py: 0.25, px: 0.5, fontSize: '0.65rem' }}
                            >
                              {pct}%
                            </Button>
                          ))}
                        </Box>
                        
                        {/* Manual price - tap to open number pad */}
                        <Box 
                          onClick={() => {
                            setNumberPadItemIdx(idx);
                            setNumberPadValue((cartItem as any).manualPrice ? String((cartItem as any).manualPrice) : '');
                            setShowNumberPad(true);
                          }}
                          sx={{ 
                            display: 'flex', alignItems: 'center', gap: 1, mb: 1, justifyContent: 'center',
                            cursor: 'pointer', p: 0.5, px: 2, borderRadius: 1, border: '1px dashed grey',
                            '&:hover': { bgcolor: 'grey.100' }
                          }}
                        >
                          <Typography variant="caption" sx={{ color: COLORS.darkText }}>Precio:</Typography>
                          <Typography sx={{ fontWeight: 'bold', color: COLORS.primary, fontSize: '0.9rem' }}>
                            {(cartItem as any).manualPrice ? formatCurrency((cartItem as any).manualPrice) : 'TAP'}
                          </Typography>
                        </Box>
                        
                        {/* Quantity controls */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mt: 1 }}>
                          <IconButton size="small" onClick={() => updateQuantity(cartItem.item.id, -1)} sx={{ bgcolor: 'grey.200' }}>
                            <Remove />
                          </IconButton>
                          <Typography sx={{ minWidth: 50, textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>
                            {cartItem.quantity}{isPerGram ? 'g' : ''}
                          </Typography>
                          <IconButton size="small" onClick={() => updateQuantity(cartItem.item.id, 1)} sx={{ bgcolor: 'grey.200' }}>
                            <Add />
                          </IconButton>
                          
                          <IconButton size="small" onClick={() => {
                            setCart(cart.filter((_, i) => i !== idx));
                          }} sx={{ ml: 2, color: COLORS.error }}>
                            <Delete />
                          </IconButton>
                        </Box>
                      </ListItem>
                    );
                  })}
                </List>
                
                {/* Discount buttons */}
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Typography sx={{ mb: 1, fontWeight: 'bold' }}>Descuento / Descuento (%)</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    {[0, 5, 10, 15, 20, 25].map(pct => (
                      <Button 
                        key={pct}
                        size="small"
                        variant={discountPercent === pct ? 'contained' : 'outlined'}
                        onClick={() => { setDiscountPercent(pct); setDiscountOverride(null); }}
                        sx={{ minWidth: 50 }}
                      >
                        {pct}%
                      </Button>
                    ))}
                  </Box>
                  
                  {/* Final total override */}
                  <Typography sx={{ mb: 1, fontWeight: 'bold' }}>Total Final / Total Final:</Typography>
                  <Box 
                    onClick={() => {
                      setNumberPadItemIdx(-1); // -1 = cart-wide override
                      setNumberPadValue(discountOverride ? String(discountOverride) : '');
                      setShowNumberPad(true);
                    }}
                    sx={{ 
                      cursor: 'pointer', p: 1, textAlign: 'center', borderRadius: 1, border: '1px dashed grey',
                      '&:hover': { bgcolor: 'grey.100' }
                    }}
                  >
                    <Typography sx={{ fontWeight: 'bold', color: COLORS.primary, fontSize: '1.3rem' }}>
                      {discountOverride ? formatCurrency(discountOverride) : 'TAP'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: COLORS.lightText }}>
                      {discountOverride ? '(overrides all)' : 'tap to set final total'}
                    </Typography>
                  </Box>
                </Paper>
                
                {/* Totals */}
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Subtotal:</Typography>
                    <Typography sx={{ fontWeight: 'bold' }}>{formatCurrency(rawTotal)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Descuento:</Typography>
                    <Typography sx={{ color: COLORS.error }}>-{formatCurrency(discountAmount)}</Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Total:</Typography>
                    <Typography sx={{ fontWeight: 'bold', fontSize: '1.2rem', color: COLORS.primary }}>{formatCurrency(finalTotal)}</Typography>
                  </Box>
                </Paper>
                
                {/* Checkout button */}
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={() => setShowCheckout(true)}
                  sx={{ bgcolor: COLORS.success, color: 'white', py: 1.5 }}
                >
                  ir a Pagar / Go to Checkout →
                </Button>
              </>
            )}
          </Box>
        )}

        {currentView === 'todo' && (
          <Box sx={{ color: COLORS.darkText }}>
            <Typography variant="h6" sx={{ mb: 2, color: COLORS.primary, fontWeight: 'bold' }}>
              Notas / TODOs ({todos.filter(t => (t.folder || 'Pending') === 'Pending').length} pendientes)
            </Typography>
            
            {/* Add new TODO with photo */}
            <Box sx={{ mb: 2, p: 2, bgcolor: 'white', borderRadius: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Nueva nota / New note..."
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                sx={{ mb: 1 }}
              />
              <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                <Button size="small" variant="outlined" startIcon={<CameraAlt />} onClick={() => todoImageInputRef.current?.click()}>
                  📷 Photo
                </Button>
                <input type="file" accept="image/*" capture="environment" ref={todoImageInputRef} hidden onChange={(e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => setNewTodoImage(reader.result as string);
                    reader.readAsDataURL(file);
                  }
                }} />
                {newTodoImage && (
                  <Box sx={{ width: 50, height: 50, borderRadius: 1, overflow: 'hidden' }}>
                    <img src={newTodoImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </Box>
                )}
              </Box>
              <Button 
                variant="contained" 
                fullWidth 
                disabled={!newTodoText.trim()}
                onClick={async () => {
                  if (!newTodoText.trim()) return;
                  await supabase.from('todos').insert({
                    request_text: newTodoText,
                    created_by: 'tati',
                    status: 'pending',
                    folder: 'Pending',
                    image_url: newTodoImage
                  });
                  setNewTodoText('');
                  setNewTodoImage(null);
                  const { data } = await supabase.from('todos').select('*').order('created_at', { ascending: false });
                  if (data) setTodos(data as Todo[]);
                }}
              >
                Agregar Nota / Add Note
              </Button>
            </Box>
            
            {/* TODO list */}
            <List>
              {todos.filter(t => (t.folder || 'Pending') === 'Pending').map(todo => (
                <ListItem key={todo.id} sx={{ bgcolor: 'white', borderRadius: 1, mb: 1, flexDirection: 'column', alignItems: 'stretch' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 1, gap: 1 }}>
                    {todo.image_url && (
                      <Box sx={{ width: 50, height: 50, borderRadius: 1, overflow: 'hidden', flexShrink: 0 }}>
                        <img src={todo.image_url} alt="Note" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </Box>
                    )}
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ flex: 1 }}>{todo.request_text}</Typography>
                      <Typography variant="caption" sx={{ color: COLORS.lightText }}>
                        {todo.created_by === 'admin' ? '📋 Admin' : '📝 Tati'} • {new Date(todo.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      size="small" 
                      variant="contained" 
                      color="success"
                      onClick={async () => {
                        await supabase.from('todos').update({ status: 'done', folder: 'Done', completed_at: new Date().toISOString() }).eq('id', todo.id);
                        const { data } = await supabase.from('todos').select('*').order('created_at', { ascending: false });
                        if (data) setTodos(data as Todo[]);
                      }}
                    >
                      ✓ Listo / Done
                    </Button>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      color="error"
                      onClick={async () => {
                        await supabase.from('todos').delete().eq('id', todo.id);
                        const { data } = await supabase.from('todos').select('*').order('created_at', { ascending: false });
                        if (data) setTodos(data as Todo[]);
                      }}
                    >
                      ✕ Eliminar
                    </Button>
                  </Box>
                </ListItem>
              ))}
              {todos.filter(t => (t.folder || 'Pending') === 'Pending').length === 0 && (
                <Typography sx={{ color: COLORS.lightText, textAlign: 'center', py: 4 }}>
                  No hay notas pendientes / No pending notes
                </Typography>
              )}
            </List>
            
            {/* Show completed (can hide them) */}
            {todos.filter(t => t.status === 'done').length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: COLORS.lightText }}>
                  Completadas / Done ({todos.filter(t => t.status === 'done').length})
                </Typography>
              </Box>
            )}
          </Box>
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
            <Button variant="contained" startIcon={<Add />} onClick={() => setShowAddItem(true)} sx={{ mr: 1, py: 1.5, bgcolor: COLORS.primary, fontSize: '1rem' }}>Agregar Item / Add Item</Button>
            <Button variant="outlined" startIcon={<Add />} onClick={() => setShowAddCategory(true)}>Agregar Categoría / Add Category</Button>
          </Box>
        )}

        {currentView === 'dashboard' && (
          <Box sx={{ textAlign: 'center', py: 2, color: '#1a1a1a' }}>
            <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold', color: '#1a1a1a' }}>💎 {businessName}</Typography>
            <Divider sx={{ my: 2 }} />
            
            {/* Today's Sales Report */}
            <Paper sx={{ p: 2, mb: 2, bgcolor: '#f8f8f8', textAlign: 'left' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#6B4C9A', mb: 1 }}>
                📊 Reporte de Hoy / Today's Report
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography sx={{ color: '#333' }}>Ventas / Sales:</Typography>
                <Typography sx={{ fontWeight: 'bold', color: '#333' }}>{todaySalesCount}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography sx={{ color: '#333' }}>Ingresos / Revenue:</Typography>
                <Typography sx={{ fontWeight: 'bold', color: '#228B22' }}>{formatCurrency(todayRevenue)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography sx={{ color: '#333' }}>Artículos / Items:</Typography>
                <Typography sx={{ fontWeight: 'bold', color: '#333' }}>{todayItemsSold}</Typography>
              </Box>
            </Paper>
            
            {/* Device Info */}
            <Paper sx={{ p: 2, mb: 2, bgcolor: '#f8f8f8', textAlign: 'left' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#6B4C9A', mb: 1 }}>
                ⚙️ Info del Dispositivo / Device
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography sx={{ color: '#333' }}>Nombre:</Typography>
                <Typography sx={{ fontWeight: 'bold', color: '#333' }}>{localStorage.getItem('crystalpos_device_name') || 'Sin Nombre'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography sx={{ color: '#333' }}>Estado:</Typography>
                <Chip label={isOnline ? '🟢 En Línea' : '🔴 Offline'} size="small" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography sx={{ color: '#333' }}>Última Sync:</Typography>
                <Typography sx={{ fontSize: '0.8rem', color: '#333' }}>{lastSync ? new Date(lastSync).toLocaleString() : 'Nunca'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography sx={{ color: '#333' }}>Items:</Typography>
                <Typography sx={{ fontWeight: 'bold' }}>{items.length}</Typography>
              </Box>
            </Paper>
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
            <Button variant="contained" color="success" size="large" startIcon={<Payment />} fullWidth onClick={() => setShowCheckout(true)} sx={{ py: 2, fontSize: '1.1rem' }}>Pagar / Checkout</Button>
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography sx={{ color: COLORS.lightText }}>Peso (g):</Typography>
                <IconButton onClick={() => setDetailWeight(Math.max(0, detailWeight - 10))} size="small" sx={{ bgcolor: 'grey.200' }}><Remove /></IconButton>
                <TextField
                  fullWidth
                  label="Peso (gramos)"
                  type="number"
                  value={detailWeight}
                  onChange={(e) => setDetailWeight(Number(e.target.value))}
                  sx={{ flex: 1, bgcolor: 'white' }}
                  inputProps={{ style: { textAlign: 'center', fontSize: '1.2rem' } }}
                />
                <IconButton onClick={() => setDetailWeight(detailWeight + 10)} size="small" sx={{ bgcolor: 'grey.200' }}><Add /></IconButton>
              </Box>

              <Typography variant="h6" sx={{ color: COLORS.darkText, mb: 1, textAlign: 'center' }}>
                Precio automático: {formatCurrency(Number(detailItem?.price_crc || 0) * detailWeight)}
              </Typography>
            </>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography sx={{ color: COLORS.lightText }}>O precio:</Typography>
            <IconButton onClick={() => setDetailFinalPrice(Math.max(0, (detailFinalPrice || 0) - 1000))} size="small" sx={{ bgcolor: 'grey.200' }}><Remove /></IconButton>
            <TextField
              fullWidth
              label="O precio final (override)"
              type="number"
              value={detailFinalPrice !== null ? detailFinalPrice : ''}
              placeholder="Precio manual"
              onChange={(e) => setDetailFinalPrice(e.target.value ? Number(e.target.value) : null)}
              sx={{ flex: 1, bgcolor: 'white' }}
              inputProps={{ style: { textAlign: 'center' } }}
            />
            <IconButton onClick={() => setDetailFinalPrice((detailFinalPrice || 0) + 1000)} size="small" sx={{ bgcolor: 'grey.200' }}><Add /></IconButton>
          </Box>
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
              <IconButton onClick={() => setDiscountPercent(Math.max(0, discountPercent - 5))} size="small" sx={{ bgcolor: 'grey.200' }}><Remove /></IconButton>
              <TextField 
                type="number" 
                size="small" 
                value={discountPercent} 
                onChange={(e) => { setDiscountPercent(Number(e.target.value)); setDiscountOverride(null); }}
                sx={{ width: 60, bgcolor: 'white' }}
                inputProps={{ style: { textAlign: 'center' } }}
              />
              <IconButton onClick={() => setDiscountPercent(Math.min(100, discountPercent + 5))} size="small" sx={{ bgcolor: 'grey.200' }}><Add /></IconButton>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography sx={{ color: COLORS.lightText }}>O precio final:</Typography>
              <IconButton onClick={() => setDiscountOverride(Math.max(0, (discountOverride || rawTotal) - 1000))} size="small" sx={{ bgcolor: 'grey.200' }}><Remove /></IconButton>
              <TextField 
                type="number" 
                size="small" 
                value={discountOverride !== null ? discountOverride : ''} 
                placeholder={formatCurrency(rawTotal)}
                onChange={(e) => setDiscountOverride(e.target.value ? Number(e.target.value) : null)}
                sx={{ width: 100, bgcolor: 'white' }}
                inputProps={{ style: { textAlign: 'center' } }}
              />
              <IconButton onClick={() => setDiscountOverride((discountOverride || rawTotal) + 1000)} size="small" sx={{ bgcolor: 'grey.200' }}><Add /></IconButton>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ mb: 2, color: COLORS.darkText, fontWeight: 'bold' }}>Total: {formatCurrency(finalTotal)}</Typography>

            <Typography sx={{ mb: 1, color: COLORS.lightText }}>Método de Pago / Payment Method:</Typography>
            <FormControl fullWidth>
              <RadioGroup row value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
                {paymentSettings.cash_enabled && (
                  <FormControlLabel value="cash" control={<Radio />} label={<Typography sx={{ color: COLORS.darkText }}>Efectivo / Cash</Typography>} />
                )}
                {paymentSettings.sinpe_enabled && (
                  <FormControlLabel value="sinpe" control={<Radio />} label={<Typography sx={{ color: COLORS.darkText }}>SINPE</Typography>} />
                )}
                {paymentSettings.card_enabled && (
                  <FormControlLabel value="card" control={<Radio />} label={<Typography sx={{ color: COLORS.darkText }}>Tarjeta / Card</Typography>} />
                )}
                {paymentSettings.lightning_enabled && (
                  <FormControlLabel value="lightning" control={<Radio />} label={<Typography sx={{ color: COLORS.darkText }}>BTC/LN</Typography>} />
                )}
              </RadioGroup>
            </FormControl>
            
            {/* Customer Receipt Section */}
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography sx={{ mb: 1, fontWeight: 'bold', color: COLORS.darkText }}>
                ¿Recibo por WhatsApp? (opcional)
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Checkbox checked={wantReceipt} onChange={(e) => setWantReceipt(e.target.checked)} />
                <Typography variant="caption" sx={{ color: COLORS.lightText }}>
                  Si el cliente quiere recibo por WhatsApp
                </Typography>
              </Box>
              
              {wantReceipt && (
                <>
                  {/* Country code selector */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <Select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} sx={{ bgcolor: 'white' }}>
                        <MenuItem value="+1">+1 US/CA</MenuItem>
                        <MenuItem value="+52">+52 MX</MenuItem>
                        <MenuItem value="+506">+506 CR</MenuItem>
                        <MenuItem value="+57">+57 CO</MenuItem>
                        <MenuItem value="+58">+58 VE</MenuItem>
                        <MenuItem value="+54">+54 AR</MenuItem>
                        <MenuItem value="+55">+55 BR</MenuItem>
                        <MenuItem value="+39">+39 IT</MenuItem>
                        <MenuItem value="+33">+33 FR</MenuItem>
                        <MenuItem value="+34">+34 ES</MenuItem>
                        <MenuItem value="+49">+49 DE</MenuItem>
                        <MenuItem value="+31">+31 NL</MenuItem>
                        <MenuItem value="__OTHER__">+ Other</MenuItem>
                      </Select>
                    </FormControl>
                    
                    {/* Phone - tap to open number pad */}
                    <Box 
                      onClick={() => {
                        setNumberPadItemIdx(-2); // -2 = phone
                        setNumberPadValue(customerPhone);
                        setShowNumberPad(true);
                      }}
                      sx={{ 
                        flex: 1, p: 1.5, borderRadius: 1, border: '1px solid #ccc', bgcolor: 'white',
                        cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' }
                      }}
                    >
                      {customerPhone ? (
                        <Typography sx={{ color: '#333' }}>{customerPhone}</Typography>
                      ) : (
                        <Typography sx={{ color: '#999' }}>Número (tap)</Typography>
                      )}
                    </Box>
                  </Box>
                  
                  {/* Customer Name - tap to open letter pad */}
                  <Box 
                    onClick={() => {
                      setNumberPadItemIdx(-3); // -3 = name
                      setNumberPadValue(customerName);
                      setShowNumberPad(true);
                    }}
                    sx={{ 
                      p: 1.5, borderRadius: 1, border: '1px solid #ccc', bgcolor: 'white',
                      cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' }
                    }}
                  >
                    {customerName ? (
                      <Typography sx={{ color: '#333' }}>{customerName}</Typography>
                    ) : (
                      <Typography sx={{ color: '#999' }}>Nombre (tap para letras)</Typography>
                    )}
                  </Box>
                </>
              )}
            </Box>
            
            <Button variant="contained" color="success" fullWidth size="large" disabled={!paymentMethod || processing} onClick={handleCheckout} sx={{ bgcolor: COLORS.success, mt: 2, py: 2.5, fontSize: '1.2rem' }}>
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
          <TextField fullWidth label="Precio Venta por g / Price per gram (CRC)" type="number" value={newItem.price_crc} onChange={(e) => setNewItem({ ...newItem, price_crc: Number(e.target.value) })} sx={{ mb: 2, bgcolor: 'white' }} />
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

      {/* Gram Input Modal for per-gram items */}
      <Dialog open={showGramModal} onClose={() => setShowGramModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', bgcolor: COLORS.primary, color: 'white' }}>
          {gramItem?.name}
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pt: 3 }}>
          <Typography variant="h4" sx={{ color: COLORS.primary, fontWeight: 'bold', mb: 2 }}>
            {gramItem ? formatCurrency(Number(gramItem.price_crc)) + '/g' : ''}
          </Typography>
          
          {/* + Quick buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3, flexWrap: 'wrap' }}>
            {[10, 25, 50, 100].map(amt => (
              <Button 
                key={amt} 
                variant="outlined" 
                onClick={() => setGramQty(amt)}
                sx={{ minWidth: 60, borderColor: gramQty === amt ? COLORS.primary : 'grey.400', color: gramQty === amt ? COLORS.primary : 'grey.600' }}
              >
                +{amt}g
              </Button>
            ))}
          </Box>
          
          {/* +/- buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
            <IconButton onClick={() => setGramQty(Math.max(0, gramQty - 10))} sx={{ bgcolor: 'grey.200', '&:hover': { bgcolor: 'grey.300' } }}>
              <Remove />
            </IconButton>
            <TextField
              type="number"
              value={gramQty}
              onChange={(e) => setGramQty(Math.max(0, Number(e.target.value)))}
              sx={{ width: 100, textAlign: 'center', '& input': { textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold' } }}
              inputProps={{ style: { textAlign: 'center' } }}
            />
            <IconButton onClick={() => setGramQty(gramQty + 10)} sx={{ bgcolor: 'grey.200', '&:hover': { bgcolor: 'grey.300' } }}>
              <Add />
            </IconButton>
          </Box>
          
          <Typography variant="h5" sx={{ mb: 2 }}>
            Total: {gramItem ? formatCurrency(Number(gramItem.price_crc) * gramQty) : '₡0'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button onClick={() => setShowGramModal(false)} sx={{ mr: 1 }}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={addGramToCart} 
            disabled={gramQty <= 0}
            sx={{ bgcolor: COLORS.primary, '&:hover': { bgcolor: COLORS.primaryDark } }}
          >
            Agregar al Carrito
          </Button>
        </DialogActions>
      </Dialog>

      {/* Number Pad - changes based on what we're editing */}
      <Dialog open={showNumberPad} onClose={() => setShowNumberPad(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', bgcolor: COLORS.primary, color: 'white' }}>
          {numberPadItemIdx === -2 ? 'Número de Teléfono' : numberPadItemIdx === -3 ? 'Nombre del Cliente' : 'Ingresar Precio'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {/* Display */}
          <Typography variant="h4" sx={{ textAlign: 'center', fontWeight: 'bold', mb: 2, color: COLORS.primary }}>
            {numberPadValue ? (numberPadItemIdx === -2 || numberPadItemIdx === -3 ? numberPadValue : formatCurrency(Number(numberPadValue))) : '₡0'}
          </Typography>
          
          {/* For NAME (-3): Show letter buttons */}
          {numberPadItemIdx === -3 ? (
            <Grid container spacing={1} sx={{ mb: 2 }}>
              {['Q','W','E','R','T','Y','U','I','O','P','A','S','D','F','G','H','J','K','L','Z','X','C','V','B','N','M','SPACE','⌫'].map(key => (
                <Grid size={key === 'SPACE' ? 6 : 3} key={key}>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    onClick={() => {
                      if (key === '⌫') {
                        setNumberPadValue(prev => prev.slice(0, -1));
                      } else if (key === 'SPACE') {
                        setNumberPadValue(prev => prev + ' ');
                      } else {
                        setNumberPadValue(prev => prev + key.toLowerCase());
                      }
                    }}
                    sx={{ py: 1.5, fontSize: '1rem', bgcolor: 'grey.300', color: 'black', textTransform: 'none' }}
                  >
                    {key === 'SPACE' ? 'espacio' : key}
                  </Button>
                </Grid>
              ))}
              <Grid size={6}>
                <Button fullWidth variant="contained" onClick={() => setNumberPadValue('')} sx={{ py: 1.5, bgcolor: COLORS.error, color: 'white' }}>Limpiar</Button>
              </Grid>
            </Grid>
          ) : (
            /* For PHONE/PRICE: Show number buttons */
            <Grid container spacing={1} sx={{ mb: 2 }}>
              {['1','2','3','4','5','6','7','8','9','C','0','⌫'].map(key => (
                <Grid size={4} key={key}>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    onClick={() => {
                      if (key === 'C') {
                        setNumberPadValue('');
                      } else if (key === '⌫') {
                        setNumberPadValue(prev => prev.slice(0, -1));
                      } else {
                        setNumberPadValue(prev => prev + key);
                      }
                    }}
                    sx={{ py: 2, fontSize: '1.5rem', bgcolor: key === 'C' ? COLORS.error : key === '⌫' ? COLORS.warning : 'grey.300', color: 'black' }}
                  >
                    {key}
                  </Button>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button onClick={() => setShowNumberPad(false)} sx={{ mr: 1 }}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              if (numberPadItemIdx === -1) {
                // Cart-wide final total override
                setDiscountOverride(Number(numberPadValue));
              } else if (numberPadItemIdx === -2) {
                // Customer phone
                setCustomerPhone(numberPadValue);
              } else if (numberPadItemIdx === -3) {
                // Customer name
                setCustomerName(numberPadValue);
              } else if (numberPadItemIdx !== null && numberPadValue) {
                // Individual item manual price
                const newCart = [...cart];
                const cartItem = newCart[numberPadItemIdx];
                const pct = (cartItem as any).itemDiscount || 0;
                newCart[numberPadItemIdx] = { 
                  ...cartItem, 
                  manualPrice: Number(numberPadValue),
                  subtotal: Number(numberPadValue) * (1 - pct / 100)
                };
                setCart(newCart);
              }
              setShowNumberPad(false);
            }}
            sx={{ bgcolor: COLORS.primary }}
          >
            Aceptar / OK
          </Button>
        </DialogActions>
      </Dialog>

      <BottomNavigation value={currentView} onChange={(_, v) => { 
          if (v !== currentView) {
            if (manualSlideshow) {
              setManualSlideshow(false);
              stopSlideshowRef.current();
            }
            setCurrentView(v);
            resetIdleTimer();
          }
        }} sx={{ bgcolor: 'white' }}>
        <BottomNavigationAction value="sales" label="Ventas" icon={<Home />} />
        <BottomNavigationAction value="gallery" label="Galería" icon={<Image />} />
        <BottomNavigationAction value="cart" label="Carrito" icon={<Badge badgeContent={cart.length} color="secondary"><ShoppingCart /></Badge>} />
        <BottomNavigationAction value="todo" label="Notas" icon={<Badge badgeContent={todos.filter(t => (t.folder || 'Pending') === 'Pending').length} color="warning"><InventoryIcon /></Badge>} />
        <BottomNavigationAction value="inventory" label="Inventario" icon={<InventoryIcon />} />
        <BottomNavigationAction value="add" label="Agregar" icon={<Add />} />
        <BottomNavigationAction value="dashboard" label="Ajustes" icon={<DashboardIcon />} />
      </BottomNavigation>
    </Box>
    </>
  );
}