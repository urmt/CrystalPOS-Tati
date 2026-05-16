'use client';

import { useMemo } from 'react';
import { 
  Box, Card, CardContent, Typography, Button, Select, MenuItem, 
  FormControl, InputLabel, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Chip, LinearProgress
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { ShoppingCart, Inventory, Assessment, CheckCircle, Refresh } from '@mui/icons-material';

import { formatCurrency, formatDate } from '@/utils/format';
import { useDashboardData } from '@/lib/hooks';
import { COLORS, PERIOD_OPTIONS } from '@/lib/constants';
import DashboardLayout from '@/components/DashboardLayout';

export default function DashboardPage() {
  const { sales, items, users, isLoading, period, setPeriod, refresh } = useDashboardData();
  
  const stats = useMemo(() => {
    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total_crc), 0);
    const transactionCount = sales.length;
    const avgSale = transactionCount > 0 ? totalRevenue / transactionCount : 0;
    const lowStock = items.filter(i => i.is_active && !i.deleted_at && (i.current_weight_grams || 0) < (i.min_threshold_grams || 100)).length;
    return { totalRevenue, transactionCount, avgSale, lowStock };
  }, [sales, items]);

  const actions = (
    <>
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Period</InputLabel>
        <Select value={period} label="Period" onChange={(e) => setPeriod(e.target.value)}>
          {PERIOD_OPTIONS.map(opt => (
            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button startIcon={<Refresh />} onClick={refresh}>Refresh</Button>
    </>
  );

  return (
    <DashboardLayout 
      currentPage="dashboard" 
      title="Dashboard" 
      subtitle="Systems Manager Overview"
      actions={actions}
    >
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
    </DashboardLayout>
  );
}