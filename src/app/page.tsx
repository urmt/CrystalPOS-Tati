'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, Card, CardContent, Typography, Button, IconButton, Select, MenuItem, 
  FormControl, InputLabel, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Chip, LinearProgress, Drawer, List, ListItem, ListItemIcon, ListItemText, Divider
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { 
  Dashboard as DashboardIcon, ShoppingCart, Inventory, People, Settings, 
  Menu as MenuIcon, Refresh, Logout, Assessment, CheckCircle, Devices 
} from '@mui/icons-material';

import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/utils/format';
import { useDashboardData } from '@/lib/hooks';

const COLORS = { 
  primary: '#6B4C9A', 
  secondary: '#D4AF37', 
  accent: '#20B2AA', 
  success: '#228B22', 
  warning: '#FFA500', 
  error: '#DC3545',
  drawerWidth: 240
};

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, href: '/' },
  { id: 'sales', label: 'Sales', icon: <ShoppingCart />, href: '/sales' },
  { id: 'inventory', label: 'Inventory', icon: <Inventory />, href: '/inventory' },
  { id: 'reports', label: 'Reports', icon: <Assessment />, href: '/reports' },
  { id: 'todos', label: 'TODOs', icon: <CheckCircle />, href: '/todos' },
  { id: 'customers', label: 'Customers', icon: <People />, href: '/customers' },
  { id: 'users', label: 'Users', icon: <People />, href: '/users' },
  { id: 'devices', label: 'Devices', icon: <Devices />, href: '/devices' },
  { id: 'settings', label: 'Settings', icon: <Settings />, href: '/settings' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(true);
  const { sales, items, users, isLoading, period, setPeriod, refresh } = useDashboardData();
  
  const stats = useMemo(() => {
    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total_crc), 0);
    const transactionCount = sales.length;
    const avgSale = transactionCount > 0 ? totalRevenue / transactionCount : 0;
    const lowStock = items.filter(i => i.is_active && !i.deleted_at && (i.current_weight_grams || 0) < (i.min_threshold_grams || 100)).length;
    return { totalRevenue, transactionCount, avgSale, lowStock };
  }, [sales, items]);
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };
  
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F7F5F3' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerOpen ? COLORS.drawerWidth : 72,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerOpen ? COLORS.drawerWidth : 72,
            boxSizing: 'border-box',
            bgcolor: COLORS.primary,
            color: 'white',
            transition: 'width 0.2s',
            overflowX: 'hidden',
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'white' }}>
          {drawerOpen && <Typography variant="h6" fontWeight="bold"><Box component="span" sx={{ color: '#D4AF37' }}>Mark</Box><Box component="span" sx={{ color: '#2E7D32' }}>et</Box><Box component="span" sx={{ color: '#D4AF37' }}>POS</Box></Typography>}
          <IconButton onClick={() => setDrawerOpen(!drawerOpen)} sx={{ color: 'white' }}>
            <MenuIcon />
          </IconButton>
        </Box>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
        <List>
          {navItems.map((item) => (
            <ListItem key={item.id} component="a" href={item.href} sx={{ bgcolor: 'transparent', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }, cursor: 'pointer', borderRadius: 1, mx: 1, my: 0.5 }}>
              <ListItemIcon sx={{ color: 'white', minWidth: drawerOpen ? 40 : 'auto' }}>{item.icon}</ListItemIcon>
              {drawerOpen && <ListItemText primary={item.label} />}
            </ListItem>
          ))}
        </List>
      </Drawer>

      <Box component="main" sx={{ flex: 1, p: 3, overflow: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, bgcolor: 'white', p: 2, borderRadius: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ color: COLORS.primary }}>Dashboard</Typography>
            <Typography variant="body2" color="text.secondary">Systems Manager Overview</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Period</InputLabel>
              <Select value={period} label="Period" onChange={(e) => setPeriod(e.target.value)}>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="week">This Week</MenuItem>
                <MenuItem value="month">This Month</MenuItem>
                <MenuItem value="year">This Year</MenuItem>
              </Select>
            </FormControl>
            <IconButton onClick={refresh} sx={{ color: COLORS.primary }}><Refresh /></IconButton>
            <Button variant="outlined" color="error" onClick={handleLogout} startIcon={<Logout />}>Logout</Button>
          </Box>
        </Box>
        
        {isLoading && <LinearProgress />}
        
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ bgcolor: COLORS.primary, color: 'white' }}>
              <CardContent>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>Total Revenue</Typography>
                <Typography variant="h4" fontWeight="bold">{formatCurrency(stats.totalRevenue)}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>{stats.transactionCount} transactions</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card><CardContent>
              <Typography variant="body2" color="text.secondary">Average Sale</Typography>
              <Typography variant="h4" fontWeight="bold" sx={{ color: COLORS.primary }}>{formatCurrency(stats.avgSale)}</Typography>
            </CardContent></Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card><CardContent>
              <Typography variant="body2" color="text.secondary">Low Stock Items</Typography>
              <Typography variant="h4" fontWeight="bold" sx={{ color: stats.lowStock > 0 ? COLORS.warning : COLORS.success }}>{stats.lowStock}</Typography>
            </CardContent></Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card><CardContent>
              <Typography variant="body2" color="text.secondary">Active Users</Typography>
              <Typography variant="h4" fontWeight="bold" sx={{ color: COLORS.primary }}>{users.filter(u => u.is_active).length}</Typography>
            </CardContent></Card>
          </Grid>
        </Grid>
        
        <Typography variant="h6" sx={{ mb: 2, mt: 3 }}>Quick Actions / Acciones Rápidas</Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 6, sm: 3 }}><Button variant="contained" fullWidth href="/pos" sx={{ py: 2, bgcolor: COLORS.primary }}><ShoppingCart sx={{ mr: 1 }} /> Nueva Venta</Button></Grid>
          <Grid size={{ xs: 6, sm: 3 }}><Button variant="contained" fullWidth href="/inventory" sx={{ py: 2, bgcolor: COLORS.secondary, color: 'black' }}><Inventory sx={{ mr: 1 }} /> Inventario</Button></Grid>
          <Grid size={{ xs: 6, sm: 3 }}><Button variant="contained" fullWidth href="/reports" sx={{ py: 2, bgcolor: COLORS.accent }}><Assessment sx={{ mr: 1 }} /> Reportes</Button></Grid>
          <Grid size={{ xs: 6, sm: 3 }}><Button variant="contained" fullWidth href="/todos" sx={{ py: 2, bgcolor: COLORS.warning, color: 'black' }}><CheckCircle sx={{ mr: 1 }} /> Notas</Button></Grid>
        </Grid>
        
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Recent Transactions</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Items</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell>Payment</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sales.slice(0, 10).map(sale => (
                    <TableRow key={sale.id}>
                      <TableCell>{formatDate(sale.sale_date, 'time')}</TableCell>
                      <TableCell>{sale.items_sold?.length || 0} items</TableCell>
                      <TableCell align="right">{formatCurrency(Number(sale.total_crc))}</TableCell>
                      <TableCell><Chip label={sale.payment_method || '-'} size="small" /></TableCell>
                      <TableCell>
                        <Chip label={sale.payment_status} size="small" color={sale.payment_status === 'completed' ? 'success' : sale.payment_status === 'failed' ? 'error' : 'warning'} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
