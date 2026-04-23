'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Box, Card, CardContent, Typography, Button, TextField, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Grid, 
  LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions, 
  MenuItem, FormControl, InputLabel, Select, Drawer, List, ListItem, 
  ListItemIcon, ListItemText, Divider, IconButton
} from '@mui/material';
import { 
  ShoppingCart, Receipt, Download, Menu as MenuIcon, Add, Refresh, Inventory, People, Settings, Dashboard as DashboardIcon, Assessment, Devices
} from '@mui/icons-material';
import { supabase } from '@/lib/supabase';
import { Sale } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';

const COLORS = { primary: '#6B4C9A', drawerWidth: 240 };
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, href: '/' },
  { id: 'sales', label: 'Sales', icon: <ShoppingCart />, href: '/sales' },
  { id: 'inventory', label: 'Inventory', icon: <Inventory />, href: '/inventory' },
  { id: 'users', label: 'Users', icon: <People />, href: '/users' },
  { id: 'reports', label: 'Reports', icon: <Assessment />, href: '/reports' },
  { id: 'devices', label: 'Devices', icon: <Devices />, href: '/devices' },
  { id: 'settings', label: 'Settings', icon: <Settings />, href: '/settings' },
];

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [drawerOpen, setDrawerOpen] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase.from('sales').select('*').order('sale_date', { ascending: false }).limit(500);
      if (data) setSales(data as Sale[]);
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filteredSales = useMemo(() => {
    let result = [...sales];
    if (dateFrom) result = result.filter(s => new Date(s.sale_date) >= new Date(dateFrom));
    if (dateTo) { const d = new Date(dateTo); d.setHours(23,59,59); result = result.filter(s => new Date(s.sale_date) <= d); }
    if (paymentFilter !== 'all') result = result.filter(s => s.payment_method === paymentFilter);
    return result;
  }, [sales, dateFrom, dateTo, paymentFilter]);

  const stats = useMemo(() => ({
    total: filteredSales.reduce((sum, s) => sum + Number(s.total_crc), 0),
    count: filteredSales.length,
    avg: filteredSales.length ? filteredSales.reduce((sum, s) => sum + Number(s.total_crc), 0) / filteredSales.length : 0,
  }), [filteredSales]);

  const breakdown = useMemo(() => ({
    sinpe: filteredSales.filter(s => s.payment_method === 'sinpe').length,
    cash: filteredSales.filter(s => s.payment_method === 'cash').length,
    card: filteredSales.filter(s => s.payment_method === 'card').length,
    lightning: filteredSales.filter(s => s.payment_method === 'lightning').length,
  }), [filteredSales]);

  const handleExport = () => {
    const csv = ['Date,Items,Total,Payment,Status'] + filteredSales.map(s => 
      `${formatDate(s.sale_date)},${s.items_sold?.length || 0},${s.total_crc},${s.payment_method},${s.payment_status}`
    ).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'sales.csv'; a.click();
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F7F5F3' }}>
      <Drawer variant="permanent" sx={{ width: drawerOpen ? COLORS.drawerWidth : 72, '& .MuiDrawer-paper': { width: drawerOpen ? COLORS.drawerWidth : 72, bgcolor: COLORS.primary, color: 'white' } }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {drawerOpen && <Typography variant="h6" fontWeight="bold">CrystalPOS</Typography>}
          <IconButton onClick={() => setDrawerOpen(!drawerOpen)} sx={{ color: 'white' }}><MenuIcon /></IconButton>
        </Box>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
        <List>{navItems.map(item => <ListItem key={item.id} component="a" href={item.href} sx={{ bgcolor: item.href === '/sales' ? 'rgba(255,255,255,0.15)' : 'transparent', cursor: 'pointer', borderRadius: 1, mx: 1 }}><ListItemIcon sx={{ color: 'white', minWidth: drawerOpen ? 40 : 'auto' }}>{item.icon}</ListItemIcon>{drawerOpen && <ListItemText primary={item.label} />}</ListItem>)}</List>
      </Drawer>

      <Box component="main" sx={{ flex: 1, p: 3, overflow: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ color: COLORS.primary }}>Sales Reports</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" startIcon={<Download />} onClick={handleExport}>Export CSV</Button>
            <Button variant="contained" startIcon={<Refresh />} onClick={fetchData}>Refresh</Button>
          </Box>
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 4 }}><Card sx={{ bgcolor: COLORS.primary, color: 'white' }}><CardContent><Typography variant="body2">Total Revenue</Typography><Typography variant="h4">{formatCurrency(stats.total)}</Typography></CardContent></Card></Grid>
          <Grid size={{ xs: 12, sm: 4 }}><Card><CardContent><Typography variant="body2">Transactions</Typography><Typography variant="h4">{stats.count}</Typography></CardContent></Card></Grid>
          <Grid size={{ xs: 12, sm: 4 }}><Card><CardContent><Typography variant="body2">Average Sale</Typography><Typography variant="h4">{formatCurrency(stats.avg)}</Typography></CardContent></Card></Grid>
        </Grid>

        <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
          <TextField size="small" type="date" label="From" value={dateFrom} onChange={e => setDateFrom(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField size="small" type="date" label="To" value={dateTo} onChange={e => setDateTo(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <FormControl size="small" sx={{ minWidth: 120 }}><InputLabel>Payment</InputLabel><Select value={paymentFilter} label="Payment" onChange={e => setPaymentFilter(e.target.value)}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="sinpe">SINPE</MenuItem>
            <MenuItem value="cash">Cash</MenuItem>
            <MenuItem value="card">Card</MenuItem>
            <MenuItem value="lightning">Lightning</MenuItem>
          </Select></FormControl>
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[['SINPE', breakdown.sinpe], ['Cash', breakdown.cash], ['Card', breakdown.card], ['Lightning', breakdown.lightning]].map(([method, count]) => (
            <Grid size={{ xs: 3 }} key={method}><Paper sx={{ p: 2, textAlign: 'center' }}><Typography variant="h6">{method}</Typography><Typography>{count}</Typography></Paper></Grid>
          ))}
        </Grid>

        {isLoading && <LinearProgress />}
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Items</TableCell><TableCell align="right">Subtotal</TableCell><TableCell align="right">Tax</TableCell><TableCell align="right">Total</TableCell><TableCell>Payment</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
            <TableBody>
              {filteredSales.map(sale => (
                <TableRow key={sale.id}>
                  <TableCell>{formatDate(sale.sale_date, 'time')}</TableCell>
                  <TableCell>{sale.items_sold?.length || 0}</TableCell>
                  <TableCell align="right">{formatCurrency(Number(sale.subtotal_crc))}</TableCell>
                  <TableCell align="right">{formatCurrency(Number(sale.tax_crc))}</TableCell>
                  <TableCell align="right">{formatCurrency(Number(sale.total_crc))}</TableCell>
                  <TableCell><Chip label={sale.payment_method || '-'} size="small" /></TableCell>
                  <TableCell><Chip label={sale.payment_status} size="small" color={sale.payment_status === 'completed' ? 'success' : sale.payment_status === 'failed' ? 'error' : 'warning'} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}