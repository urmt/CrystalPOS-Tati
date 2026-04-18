'use client';

import { useState, useEffect } from 'react';
import { 
  Box, Typography, Card, CardContent, Grid, Paper, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  FormControl, InputLabel, Select, MenuItem, TextField, Button,
  Divider
} from '@mui/material';
import { Assessment as AssessmentIcon, TrendingUp, ShoppingCart, Inventory } from '@mui/icons-material';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/utils/format';
import DashboardLayout from '@/components/DashboardLayout';

const COLORS = { primary: '#6B4C9A', success: '#228B22', error: '#DC3545', warning: '#FF9800' };

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [summary, setSummary] = useState({ totalRevenue: 0, totalSales: 0, avgSale: 0, count: 0 });
  const [paymentBreakdown, setPaymentBreakdown] = useState({ cash: 0, sinpe: 0, card: 0, lightning: 0 });
  const [topItems, setTopItems] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);

  useEffect(() => {
    fetchReports();
  }, [dateFrom, dateTo]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      // Get sales in date range
      const { data: sales } = await supabase
        .from('sales')
        .select('*')
        .gte('sale_date', dateFrom)
        .lte('sale_date', dateTo + 'T23:59:59')
        .order('sale_date', { ascending: false });

      if (sales && sales.length > 0) {
        // Calculate summary
        const totalRevenue = sales.reduce((sum, s) => sum + (s.total_crc || 0), 0);
        const count = sales.length;
        setSummary({
          totalRevenue,
          totalSales: totalRevenue,
          avgSale: count > 0 ? totalRevenue / count : 0,
          count
        });

        // Payment breakdown
        const breakdown = { cash: 0, sinpe: 0, card: 0, lightning: 0 };
        sales.forEach(s => {
          const method = (s.payment_method || 'cash') as keyof typeof breakdown;
          if (breakdown[method] !== undefined) breakdown[method] += s.total_crc || 0;
        });
        setPaymentBreakdown(breakdown);

        // Top selling items
        const itemSales: Record<string, { qty: number; revenue: number; name: string }> = {};
        sales.forEach(s => {
          (s.items_sold || []).forEach((item: any) => {
            if (!itemSales[item.item_id]) {
              itemSales[item.item_id] = { qty: 0, revenue: 0, name: item.name };
            }
            itemSales[item.item_id].qty += item.qty_grams || 0;
            itemSales[item.item_id].revenue += item.price || 0;
          });
        });
        const top = Object.entries(itemSales)
          .map(([id, data]) => ({ id, ...data }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10);
        setTopItems(top);
      } else {
        setSummary({ totalRevenue: 0, totalSales: 0, avgSale: 0, count: 0 });
        setPaymentBreakdown({ cash: 0, sinpe: 0, card: 0, lightning: 0 });
        setTopItems([]);
      }

      // Low stock items from inventory
      const { data: items } = await supabase
        .from('items')
        .select('*')
        .eq('is_active', true)
        .gt('current_weight_grams', 0)
        .order('current_weight_grams', { ascending: true })
        .limit(20);

      if (items) {
        // Calculate days until empty for each
        const low = items.filter(i => (i.depletion_rate_grams_per_day || 0) > 0).map(item => {
          const days = Math.round((item.current_weight_grams || 0) / (item.depletion_rate_grams_per_day || 1));
          return { ...item, daysUntilEmpty: days };
        }).filter(i => i.daysUntilEmpty <= 60);
        setLowStockItems(low.slice(0, 10));
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout currentPage="reports">
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <AssessmentIcon sx={{ fontSize: 32, color: COLORS.primary }} />
          <Typography variant="h4" sx={{ color: COLORS.primary, fontWeight: 'bold' }}>Reports</Typography>
        </Box>

        {/* Date Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Date Range</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              type="date"
              label="From"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 150 }}
            />
            <TextField
              type="date"
              label="To"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 150 }}
            />
            <Button variant="contained" onClick={fetchReports} sx={{ bgcolor: COLORS.primary }}>
              Update Report
            </Button>
          </Box>
        </Paper>

        {loading ? (
          <Typography>Loading reports...</Typography>
        ) : (
          <>
            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ bgcolor: COLORS.primary, color: 'white' }}>
                  <CardContent>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Total Revenue</Typography>
                    <Typography variant="h4" fontWeight="bold">{formatCurrency(summary.totalRevenue)}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">Transactions</Typography>
                    <Typography variant="h4" fontWeight="bold">{summary.count}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">Average Sale</Typography>
                    <Typography variant="h4" fontWeight="bold">{formatCurrency(summary.avgSale)}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">Low Stock Alerts</Typography>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: lowStockItems.length > 0 ? COLORS.warning : COLORS.success }}>
                      {lowStockItems.length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Payment Breakdown */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Revenue by Payment Method</Typography>
              <Grid container spacing={2}>
                {Object.entries(paymentBreakdown).map(([method, amount]) => (
                  <Grid size={{ xs: 6, sm: 3 }} key={method}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography sx={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{method}</Typography>
                        <Typography variant="h5" sx={{ color: COLORS.primary }}>{formatCurrency(amount)}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>

            {/* Top Selling Items & Low Stock */}
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Top Selling Items</Typography>
                  {topItems.length === 0 ? (
                    <Typography color="text.secondary">No sales in this period</Typography>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Item</TableCell>
                            <TableCell align="right">Qty (g)</TableCell>
                            <TableCell align="right">Revenue</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {topItems.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{item.name}</TableCell>
                              <TableCell align="right">{item.qty}</TableCell>
                              <TableCell align="right">{formatCurrency(item.revenue)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2, color: COLORS.warning }}>⚠️ Low Stock Alerts (60 days or less)</Typography>
                  {lowStockItems.length === 0 ? (
                    <Typography color="text.secondary">All items well stocked!</Typography>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Item</TableCell>
                            <TableCell align="right">Stock (g)</TableCell>
                            <TableCell align="right">Days Left</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {lowStockItems.map((item, idx) => (
                            <TableRow key={idx} sx={{ 
                              bgcolor: item.daysUntilEmpty <= 30 ? `${COLORS.error}20` : `${COLORS.warning}20` 
                            }}>
                              <TableCell sx={{ fontWeight: 'bold' }}>{item.name}</TableCell>
                              <TableCell align="right">{item.current_weight_grams}g</TableCell>
                              <TableCell align="right" sx={{ 
                                color: item.daysUntilEmpty <= 30 ? COLORS.error : COLORS.warning,
                                fontWeight: 'bold'
                              }}>
                                {item.daysUntilEmpty} days
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </>
        )}
      </Box>
    </DashboardLayout>
  );
}