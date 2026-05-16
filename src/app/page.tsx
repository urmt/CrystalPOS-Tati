'use client';

import { useMemo } from 'react';
import { Card, CardContent, Typography, Button, Select, MenuItem, FormControl, InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, LinearProgress } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { ShoppingCart, Inventory, Assessment, CheckCircle, Refresh } from '@mui/icons-material';
import { formatCurrency, formatDate } from '@/utils/format';
import { useDashboardData } from '@/lib/hooks';
import { COLORS, PERIOD_OPTIONS } from '@/lib/constants';
import DashboardLayout from '@/components/DashboardLayout';

const quickActions = [
  { label: 'Nueva Venta', icon: <ShoppingCart sx={{ mr: 1 }} />, href: '/pos', bgcolor: COLORS.primary },
  { label: 'Inventario', icon: <Inventory sx={{ mr: 1 }} />, href: '/inventory', bgcolor: COLORS.secondary, color: 'black' },
  { label: 'Reportes', icon: <Assessment sx={{ mr: 1 }} />, href: '/reports', bgcolor: COLORS.accent },
  { label: 'Notas', icon: <CheckCircle sx={{ mr: 1 }} />, href: '/todos', bgcolor: COLORS.warning, color: 'black' },
];

function getStatusColor(status: string): "success" | "error" | "warning" | "default" {
  if (status === 'completed') return 'success';
  if (status === 'failed') return 'error';
  return 'warning';
}

export default function DashboardPage() {
  const { sales, items, users, isLoading, period, setPeriod, refresh } = useDashboardData();

  const stats = useMemo(() => {
    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total_crc), 0);
    const activeUsers = users.filter(u => u.is_active).length;
    const lowStockItems = items.filter(i => i.is_active && !i.deleted_at && (i.current_weight_grams || 0) < (i.min_threshold_grams || 100)).length;
    return {
      totalRevenue,
      transactionCount: sales.length,
      avgSale: sales.length > 0 ? totalRevenue / sales.length : 0,
      activeUsers,
      lowStockItems
    };
  }, [sales, items, users]);

  return (
    <DashboardLayout currentPage="dashboard" title="Dashboard" subtitle="Systems Manager Overview" actions={
      <>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Period</InputLabel>
          <Select value={period} label="Period" onChange={(e) => setPeriod(e.target.value)}>
            {PERIOD_OPTIONS.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
          </Select>
        </FormControl>
        <Button startIcon={<Refresh />} onClick={refresh}>Refresh</Button>
      </>
    }>
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
            <Typography variant="h4" fontWeight="bold" sx={{ color: stats.lowStockItems > 0 ? COLORS.warning : COLORS.success }}>{stats.lowStockItems}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary">Active Users</Typography>
            <Typography variant="h4" fontWeight="bold" sx={{ color: COLORS.primary }}>{stats.activeUsers}</Typography>
          </CardContent></Card>
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ mb: 2, mt: 3 }}>Quick Actions / Acciones Rápidas</Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {quickActions.map(action => (
          <Grid size={{ xs: 6, sm: 3 }} key={action.label}>
            <Button variant="contained" fullWidth href={action.href} sx={{ py: 2, bgcolor: action.bgcolor, color: action.color || 'white' }}>
              {action.icon}{action.label}
            </Button>
          </Grid>
        ))}
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
                    <TableCell><Chip label={sale.payment_status} size="small" color={getStatusColor(sale.payment_status)} /></TableCell>
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