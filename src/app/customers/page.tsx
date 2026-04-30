'use client';

import { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Paper, TextField, InputAdornment, List, ListItem, ListItemText, Chip
} from '@mui/material';
import { Search, Download, Refresh, Dashboard as DashboardIcon, ShoppingCart, Inventory, Settings, Assessment } from '@mui/icons-material';
import { supabase } from '@/lib/supabase';
import { Customer } from '@/types';

const COLORS = { primary: '#6B4C9A', secondary: '#D4AF37' };
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, href: '/' },
  { id: 'sales', label: 'Sales', icon: <ShoppingCart />, href: '/sales' },
  { id: 'inventory', label: 'Inventory', icon: <Inventory />, href: '/inventory' },
  { id: 'reports', label: 'Reports', icon: <Assessment />, href: '/reports' },
  { id: 'customers', label: 'Customers', icon: <Assessment />, href: '/customers' },
  { id: 'settings', label: 'Settings', icon: <Settings />, href: '/settings' },
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('last_purchase', { ascending: false });
      
      if (error) {
        console.error('Supabase error:', error);
        alert('Error: ' + error.message);
      }
      if (data) {
        console.log('Customers fetched:', data);
        setCustomers(data as Customer[]);
      }
    } catch (e) { 
      console.error('Error fetching customers:', e); 
      alert('Error: ' + e);
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filteredCustomers = customers.filter(c => 
    c.phone.includes(searchQuery) || 
    (c.name && c.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(amount);
  };

  const exportCSV = () => {
    const headers = ['Phone', 'Name', 'Total Purchases', 'Purchase Count', 'Last Purchase', 'Special Requests'];
    const rows = filteredCustomers.map(c => [
      c.country_code + ' ' + c.phone,
      c.name || '',
      c.total_purchases,
      c.purchase_count,
      c.last_purchase || '',
      c.special_requests || ''
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((sum, c) => sum + (c.total_purchases || 0), 0);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Sidebar */}
      <Paper sx={{ width: 220, p: 2, borderRadius: 0 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: COLORS.primary, mb: 4 }}>
          💎 CrystalPOS
        </Typography>
        <List>
          {navItems.map(item => (
            <ListItem 
              key={item.id}
              component="a" 
              href={item.href}
              sx={{ 
                borderRadius: 1, 
                mb: 0.5,
                bgcolor: item.id === 'customers' ? COLORS.primary : 'transparent',
                color: item.id === 'customers' ? 'white' : '#333',
                '&:hover': { bgcolor: item.id === 'customers' ? COLORS.primary : '#eee' }
              }}
            >
              <ListItemText primary={item.label} />
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Main Content */}
      <Box sx={{ flex: 1, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: COLORS.primary }}>
            Customers ({totalCustomers})
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button startIcon={<Refresh />} onClick={fetchData}>Refresh</Button>
            <Button startIcon={<Download />} variant="contained" onClick={exportCSV} sx={{ bgcolor: COLORS.primary }}>
              Export CSV
            </Button>
          </Box>
        </Box>

        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Paper sx={{ p: 2, flex: 1 }}>
            <Typography variant="caption" sx={{ color: '#666' }}>Total Customers</Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{totalCustomers}</Typography>
          </Paper>
          <Paper sx={{ p: 2, flex: 1 }}>
            <Typography variant="caption" sx={{ color: '#666' }}>Total Revenue</Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: COLORS.primary }}>{formatCurrency(totalRevenue)}</Typography>
          </Paper>
        </Box>

        {/* Search */}
        <TextField
          fullWidth
          placeholder="Buscar por teléfono o nombre / Search by phone or name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 2, bgcolor: 'white' }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search /></InputAdornment>
          }}
        />

        {/* Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ bgcolor: COLORS.primary }}>
              <TableRow>
                <TableCell sx={{ color: 'white' }}>Phone</TableCell>
                <TableCell sx={{ color: 'white' }}>Name</TableCell>
                <TableCell sx={{ color: 'white' }}>Total</TableCell>
                <TableCell sx={{ color: 'white' }}>Purchases</TableCell>
                <TableCell sx={{ color: 'white' }}>Last Purchase</TableCell>
                <TableCell sx={{ color: 'white' }}>Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} align="center">Loading...</TableCell></TableRow>
              ) : filteredCustomers.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center">No customers yet</TableCell></TableRow>
              ) : filteredCustomers.map(customer => (
                <TableRow key={customer.id} hover>
                  <TableCell>{customer.country_code} {customer.phone}</TableCell>
                  <TableCell>{customer.name || '-'}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: COLORS.primary }}>
                    {formatCurrency(customer.total_purchases || 0)}
                  </TableCell>
                  <TableCell>{customer.purchase_count || 0}</TableCell>
                  <TableCell>
                    {customer.last_purchase ? new Date(customer.last_purchase).toLocaleDateString('es-CR') : '-'}
                  </TableCell>
                  <TableCell>
                    {customer.special_requests && (
                      <Chip label={customer.special_requests} size="small" sx={{ bgcolor: COLORS.secondary }} />
                    )}
                    {customer.notes && <Typography variant="caption" display="block">{customer.notes}</Typography>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}