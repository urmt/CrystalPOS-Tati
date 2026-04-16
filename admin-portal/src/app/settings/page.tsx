'use client';

import { useState, useEffect } from 'react';
import { 
  Box, Typography, Card, CardContent, TextField, Button, Tabs, Tab, 
  FormControlLabel, Switch, Drawer, List, ListItem, ListItemIcon, 
  ListItemText, Divider, IconButton, ListItemButton
} from '@mui/material';
import { Settings as SettingsIcon, Business, Category, Payment } from '@mui/icons-material';
import { supabase } from '@/lib/supabase';
import { Category as CategoryType } from '@/types';

const COLORS = { primary: '#6B4C9A', drawerWidth: 240 };
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: <SettingsIcon />, href: '/' },
  { id: 'sales', label: 'Sales', icon: <SettingsIcon />, href: '/sales' },
  { id: 'inventory', label: 'Inventory', icon: <SettingsIcon />, href: '/inventory' },
  { id: 'users', label: 'Users', icon: <SettingsIcon />, href: '/users' },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon />, href: '/settings' },
];

export default function SettingsPage() {
  const [tab, setTab] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [businessSettings, setBusinessSettings] = useState({ business_name: 'Crystal Market', business_email: 'info@crystalmarket.com', business_phone: '+506 1234 5678', address: 'Costa Rica' });
  const [paymentSettings, setPaymentSettings] = useState({ sinpe_enabled: true, cash_enabled: true, card_enabled: true, lightning_enabled: true });

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('display_order');
    if (data) setCategories(data as CategoryType[]);
  };

  const handleSaveCategory = async (cat: CategoryType, newName: string) => {
    await supabase.from('categories').update({ name: newName }).eq('id', cat.id);
    fetchCategories();
  };

  const handleAddCategory = async () => {
    const name = prompt('Category name:');
    if (!name) return;
    await supabase.from('categories').insert({ id: crypto.randomUUID(), name, display_order: categories.length + 1, is_active: true, created_at: new Date().toISOString() });
    fetchCategories();
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F7F5F3' }}>
      <Drawer variant="permanent" sx={{ width: drawerOpen ? COLORS.drawerWidth : 72, '& .MuiDrawer-paper': { width: drawerOpen ? COLORS.drawerWidth : 72, bgcolor: COLORS.primary, color: 'white' } }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {drawerOpen && <Typography variant="h6" fontWeight="bold">CrystalPOS</Typography>}
          <IconButton onClick={() => setDrawerOpen(!drawerOpen)} sx={{ color: 'white' }}><SettingsIcon /></IconButton>
        </Box>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
        <List>{navItems.map(item => <ListItem key={item.id} component="a" href={item.href} sx={{ bgcolor: item.href === '/settings' ? 'rgba(255,255,255,0.15)' : 'transparent', cursor: 'pointer', borderRadius: 1, mx: 1 }}><ListItemIcon sx={{ color: 'white', minWidth: drawerOpen ? 40 : 'auto' }}>{item.icon}</ListItemIcon>{drawerOpen && <ListItemText primary={item.label} />}</ListItem>)}</List>
      </Drawer>

      <Box component="main" sx={{ flex: 1, p: 3, overflow: 'auto' }}>
        <Typography variant="h4" fontWeight="bold" sx={{ color: COLORS.primary, mb: 3 }}>Settings</Typography>

        <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}>
          <Tab icon={<Business />} label="Business" />
          <Tab icon={<Category />} label="Categories" />
          <Tab icon={<Payment />} label="Payments" />
        </Tabs>

        {tab === 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Business Information</Typography>
              <TextField fullWidth label="Business Name" value={businessSettings.business_name} onChange={e => setBusinessSettings({ ...businessSettings, business_name: e.target.value })} sx={{ mb: 2 }} />
              <TextField fullWidth label="Email" value={businessSettings.business_email} onChange={e => setBusinessSettings({ ...businessSettings, business_email: e.target.value })} sx={{ mb: 2 }} />
              <TextField fullWidth label="Phone" value={businessSettings.business_phone} onChange={e => setBusinessSettings({ ...businessSettings, business_phone: e.target.value })} sx={{ mb: 2 }} />
              <TextField fullWidth label="Address" value={businessSettings.address} onChange={e => setBusinessSettings({ ...businessSettings, address: e.target.value })} sx={{ mb: 2 }} />
              <Button variant="contained">Save Business Settings</Button>
            </CardContent>
          </Card>
        )}

        {tab === 1 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Product Categories</Typography>
              {categories.map(cat => (
                <ListItemButton key={cat.id} sx={{ mb: 1 }}>
                  <ListItemText primary={cat.name} secondary={`Order: ${cat.display_order}`} />
                </ListItemButton>
              ))}
              <Button variant="contained" startIcon={<Category />} onClick={handleAddCategory} sx={{ mt: 2 }}>Add Category</Button>
            </CardContent>
          </Card>
        )}

        {tab === 2 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Payment Methods</Typography>
              <FormControlLabel control={<Switch checked={paymentSettings.sinpe_enabled} onChange={e => setPaymentSettings({ ...paymentSettings, sinpe_enabled: e.target.checked })} />} label="SINPE Móvil" sx={{ display: 'block', mb: 1 }} />
              <FormControlLabel control={<Switch checked={paymentSettings.cash_enabled} onChange={e => setPaymentSettings({ ...paymentSettings, cash_enabled: e.target.checked })} />} label="Cash" sx={{ display: 'block', mb: 1 }} />
              <FormControlLabel control={<Switch checked={paymentSettings.card_enabled} onChange={e => setPaymentSettings({ ...paymentSettings, card_enabled: e.target.checked })} />} label="Card" sx={{ display: 'block', mb: 1 }} />
              <FormControlLabel control={<Switch checked={paymentSettings.lightning_enabled} onChange={e => setPaymentSettings({ ...paymentSettings, lightning_enabled: e.target.checked })} />} label="Lightning (Bitcoin)" sx={{ display: 'block', mb: 2 }} />
              <Button variant="contained">Save Payment Settings</Button>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
}