'use client';

import { useState, useEffect } from 'react';
import { 
  Box, Typography, Card, CardContent, TextField, Button, Tabs, Tab, 
  FormControlLabel, Switch, Alert, Snackbar, Paper, IconButton, Drawer, List, ListItem, ListItemText, Divider, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { Settings as SettingsIcon, Business, Category, Payment, Add, Delete, Menu as MenuIcon, Dashboard as DashboardIcon, ShoppingCart, Inventory, Assessment, CheckCircle, People, Devices
} from '@mui/icons-material';
import { supabase } from '@/lib/supabase';
import { Category as CategoryType } from '@/types';
import DashboardLayout from '@/components/DashboardLayout';

export default function SettingsPage() {
  const [tab, setTab] = useState(0);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [businessSettings, setBusinessSettings] = useState({ 
    business_name: 'Crystal Market', 
    business_name_size: 'normal',
    business_tagline: 'por Tati',
    business_email: 'info@crystalmarket.com', 
    business_phone: '+506 1234 5678', 
    address: 'Costa Rica' 
  });
  const [paymentSettings, setPaymentSettings] = useState({ 
    sinpe_enabled: true, 
    cash_enabled: true, 
    card_enabled: true, 
    lightning_enabled: true 
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success'
  });

  useEffect(() => { 
    fetchCategories(); 
    fetchSubcategories();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data: business } = await supabase.from('app_settings').select('setting_value').eq('setting_key', 'business').single();
      const { data: payments } = await supabase.from('app_settings').select('setting_value').eq('setting_key', 'payments').single();
      if (business?.setting_value) setBusinessSettings(business.setting_value);
      if (payments?.setting_value) setPaymentSettings(payments.setting_value);
    } catch (err) { console.error('Error fetching settings:', err); }
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('display_order');
    if (data) setCategories(data as CategoryType[]);
  };

  const fetchSubcategories = async () => {
    const { data } = await supabase.from('subcategories').select('*').order('display_order');
    if (data) setSubcategories(data as CategoryType[]);
  };

  const handleSaveBusiness = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('app_settings').upsert({
        setting_key: 'business',
        setting_value: businessSettings,
        updated_at: new Date().toISOString()
      }, { onConflict: 'setting_key' });
      if (error) throw error;
      setSnackbar({ open: true, message: 'Business settings saved!', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to save settings', severity: 'error' });
    } finally { setLoading(false); }
  };

  const handleSavePayments = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('app_settings').upsert({
        setting_key: 'payments',
        setting_value: paymentSettings,
        updated_at: new Date().toISOString()
      }, { onConflict: 'setting_key' });
      if (error) throw error;
      setSnackbar({ open: true, message: 'Payment settings saved!', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to save settings', severity: 'error' });
    } finally { setLoading(false); }
  };

  const handleAddCategory = async () => {
    const name = prompt('Category name:');
    if (!name) return;
    try {
      await supabase.from('categories').insert({ name, display_order: categories.length + 1, is_active: true });
      fetchCategories();
      setSnackbar({ open: true, message: 'Category added!', severity: 'success' });
    } catch (err) { setSnackbar({ open: true, message: 'Failed to add category', severity: 'error' }); }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      await supabase.from('categories').delete().eq('id', id);
      fetchCategories();
      setSnackbar({ open: true, message: 'Category deleted', severity: 'success' });
    } catch (err) { setSnackbar({ open: true, message: 'Failed to delete', severity: 'error' }); }
  };

  const handleAddSubcategory = async (categoryId: string) => {
    const name = prompt('Subcategory name:');
    if (!name) return;
    const catSubcats = subcategories.filter(s => s.category_id === categoryId);
    try {
      await supabase.from('subcategories').insert({ name, category_id: categoryId, display_order: catSubcats.length + 1, is_active: true });
      fetchSubcategories();
      setSnackbar({ open: true, message: 'Subcategory added!', severity: 'success' });
    } catch (err) { setSnackbar({ open: true, message: 'Failed to add subcategory', severity: 'error' }); }
  };

  return (
    <DashboardLayout currentPage="settings" title="Configuración">

        <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}>
          <Tab icon={<Business />} label="Negocio" />
          <Tab icon={<Category />} label="Categorías" />
          <Tab icon={<Payment />} label="Pagos" />
        </Tabs>

        {tab === 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Información del Negocio / Business Information</Typography>
              <TextField fullWidth label="Nombre del Negocio / Business Name" value={businessSettings.business_name} onChange={(e) => setBusinessSettings({ ...businessSettings, business_name: e.target.value })} sx={{ mb: 2 }} />
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Tamaño del Nombre / Name Size</InputLabel>
                <Select 
                  value={businessSettings.business_name_size || 'normal'} 
                  label="Tamaño del Nombre / Name Size"
                  onChange={(e) => setBusinessSettings({ ...businessSettings, business_name_size: e.target.value })}
                >
                  <MenuItem value="normal">Normal (Grande / Large)</MenuItem>
                  <MenuItem value="small">Pequeño / Small (50%)</MenuItem>
                </Select>
              </FormControl>
              
              <TextField fullWidth label="Texto Secondary / Tagline (e.g., 'por Tati')" value={businessSettings.business_tagline} onChange={(e) => setBusinessSettings({ ...businessSettings, business_tagline: e.target.value })} sx={{ mb: 2 }} />
              
              <TextField fullWidth label="Correo / Email" value={businessSettings.business_email} onChange={(e) => setBusinessSettings({ ...businessSettings, business_email: e.target.value })} sx={{ mb: 2 }} />
              <TextField fullWidth label="Teléfono / Phone" value={businessSettings.business_phone} onChange={(e) => setBusinessSettings({ ...businessSettings, business_phone: e.target.value })} sx={{ mb: 2 }} />
              <TextField fullWidth label="Dirección / Address" value={businessSettings.address} onChange={(e) => setBusinessSettings({ ...businessSettings, address: e.target.value })} sx={{ mb: 2 }} />
              <Button variant="contained" onClick={handleSaveBusiness} disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar / Save'}
              </Button>
            </CardContent>
          </Card>
        )}

        {tab === 1 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Categorías de Productos</Typography>
              {categories.map(cat => (
                <Paper key={cat.id} sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography fontWeight="bold">{cat.name}</Typography>
                    <Box>
                      <Button size="small" onClick={() => handleAddSubcategory(cat.id)}>+</Button>
                      <Button size="small" color="error" onClick={() => handleDeleteCategory(cat.id)}><Delete /></Button>
                    </Box>
                  </Box>
                  {subcategories.filter(s => s.category_id === cat.id).map(sub => (
                    <Typography key={sub.id} sx={{ pl: 2, fontSize: '0.9rem', color: '#666' }}>- {sub.name}</Typography>
                  ))}
                </Paper>
              ))}
              <Button variant="contained" startIcon={<Add />} onClick={handleAddCategory} sx={{ mt: 2 }}>Agregar Categoría</Button>
            </CardContent>
          </Card>
        )}

        {tab === 2 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Métodos de Pago</Typography>
              <FormControlLabel control={<Switch checked={paymentSettings.sinpe_enabled} onChange={(e) => setPaymentSettings({ ...paymentSettings, sinpe_enabled: e.target.checked })} />} label="SINPE Móvil" sx={{ display: 'block', mb: 1 }} />
              <FormControlLabel control={<Switch checked={paymentSettings.cash_enabled} onChange={(e) => setPaymentSettings({ ...paymentSettings, cash_enabled: e.target.checked })} />} label="Efectivo" sx={{ display: 'block', mb: 1 }} />
              <FormControlLabel control={<Switch checked={paymentSettings.card_enabled} onChange={(e) => setPaymentSettings({ ...paymentSettings, card_enabled: e.target.checked })} />} label="Tarjeta" sx={{ display: 'block', mb: 1 }} />
              <FormControlLabel control={<Switch checked={paymentSettings.lightning_enabled} onChange={(e) => setPaymentSettings({ ...paymentSettings, lightning_enabled: e.target.checked })} />} label="Lightning (Bitcoin)" sx={{ display: 'block', mb: 2 }} />
              <Button variant="contained" onClick={handleSavePayments} disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar'}
              </Button>
            </CardContent>
          </Card>
        )}

        <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
        </Snackbar>
    </DashboardLayout>
  );
}