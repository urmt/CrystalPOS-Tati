'use client';

import { useState, useEffect } from 'react';
import { 
  Box, Typography, Card, CardContent, Grid, Paper, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Button, Tabs, Tab, IconButton, Chip
} from '@mui/material';
import { Assessment as AssessmentIcon, Download, Print } from '@mui/icons-material';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/utils/format';
import DashboardLayout from '@/components/DashboardLayout';

const COLORS = { primary: '#6B4C9A', success: '#228B22', error: '#DC3545', warning: '#FF9800', secondary: '#D4AF37' };

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other} style={{ display: value !== index ? 'none' : 'block' }}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ReportsPage() {
  const [tab, setTab] = useState(0);
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0]; });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  
  // Sales data
  const [sales, setSales] = useState<any[]>([]);
  const [salesSummary, setSalesSummary] = useState({ revenue: 0, returns: 0, netRevenue: 0, cogs: 0, grossProfit: 0, count: 0, avgSale: 0 });
  const [paymentBreakdown, setPaymentBreakdown] = useState<Record<string, number>>({});
  const [salesByHour, setSalesByHour] = useState<Record<number, number>>({});
  
  // Inventory data
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  // Top & Bottom items
  const [topItems, setTopItems] = useState<any[]>([]);
  const [slowItems, setSlowItems] = useState<any[]>([]);
  const [topMargin, setTopMargin] = useState<any[]>([]);
  
  // Low stock
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);

  useEffect(() => { fetchAllData(); }, [dateFrom, dateTo]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch sales
      const { data: salesData } = await supabase
        .from('sales')
        .select('*')
        .gte('sale_date', dateFrom)
        .lte('sale_date', dateTo + 'T23:59:59')
        .order('sale_date', { ascending: false });
      
      // Fetch inventory items
      const { data: itemsData } = await supabase.from('items').select('*').eq('is_active', true).order('name');
      const { data: catsData } = await supabase.from('categories').select('*').eq('is_active', true).order('display_order');
      
      if (salesData) setSales(salesData);
      if (itemsData) setItems(itemsData);
      if (catsData) setCategories(catsData);

      // Calculate sales summary
      if (salesData && salesData.length > 0) {
        const totalRevenue = salesData.reduce((sum, s) => sum + (s.total_crc || 0), 0);
        const count = salesData.length;
        
        // Payment breakdown
        const payments: Record<string, number> = { cash: 0, sinpe: 0, card: 0, lightning: 0 };
        const byHour: Record<number, number> = {};
        
        // Calculate sales summary
      // Create items map for cost lookup
      const itemsMap: Record<string, any> = {};
      (itemsData || []).forEach(item => { itemsMap[item.id] = item; });
      
      let totalCOGS = 0;
      let itemSalesMap: Record<string, { qty: number; revenue: number; name: string; cost: number }> = {};
      
      salesData.forEach(sale => {
        const hour = new Date(sale.sale_date).getHours();
        byHour[hour] = (byHour[hour] || 0) + (sale.total_crc || 0);
        
        const method = (sale.payment_method || 'cash') as string;
        if (method === 'sinpe' || method === 'cash' || method === 'card' || method === 'lightning') {
          payments[method] = (payments[method] || 0) + (sale.total_crc || 0);
        }
        
        (sale.items_sold || []).forEach((item: any) => {
          // Get cost from items table
          const itemData = itemsMap[item.item_id];
          const costPerGram = itemData?.cost_per_gram || 0;
          const cost = costPerGram * (item.qty_grams || 0);
          totalCOGS += cost;
          
          if (!itemSalesMap[item.item_id]) {
            itemSalesMap[item.item_id] = { qty: 0, revenue: 0, name: item.name, cost: 0 };
          }
          itemSalesMap[item.item_id].qty += item.qty_grams || 0;
          itemSalesMap[item.item_id].revenue += item.price || 0;
          itemSalesMap[item.item_id].cost += cost;
        });
      });

        setSalesSummary({
          revenue: totalRevenue,
          returns: 0,
          netRevenue: totalRevenue,
          cogs: totalCOGS,
          grossProfit: totalRevenue - totalCOGS,
          count,
          avgSale: count > 0 ? totalRevenue / count : 0
        });
        setPaymentBreakdown(payments);
        setSalesByHour(byHour);

        // Top selling items
        const top = Object.entries(itemSalesMap)
          .map(([id, data]) => ({ id, ...data }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 15);
        setTopItems(top);

        // Top margin items
        const marginItems = Object.entries(itemSalesMap)
          .map(([id, data]) => ({ 
            id, 
            name: data.name, 
            revenue: data.revenue, 
            cost: data.cost, 
            margin: data.revenue - data.cost,
            marginPct: data.cost > 0 ? ((data.revenue - data.cost) / data.cost) * 100 : 0
          }))
          .filter(i => i.revenue > 0)
          .sort((a, b) => b.marginPct - a.marginPct)
          .slice(0, 15);
        setTopMargin(marginItems);

        // Slow movers (items with sales but low quantity)
        const slow = Object.entries(itemSalesMap)
          .map(([id, data]) => ({ id, ...data }))
          .filter(i => i.qty > 0)
          .sort((a, b) => a.qty - b.qty)
          .slice(0, 10);
        setSlowItems(slow);
      } else {
        setSalesSummary({ revenue: 0, returns: 0, netRevenue: 0, cogs: 0, grossProfit: 0, count: 0, avgSale: 0 });
        setPaymentBreakdown({});
        setSalesByHour({});
        setTopItems([]);
        setSlowItems([]);
        setTopMargin([]);
      }

      // Low stock items
      if (itemsData) {
        const low = itemsData.filter(i => (i.depletion_rate_grams_per_day || 0) > 0 && (i.current_weight_grams || 0) > 0).map(item => {
          const days = Math.round((item.current_weight_grams || 0) / (i.depletion_rate_grams_per_day || 1));
          return { ...item, daysUntilEmpty: days };
        }).filter(i => i.daysUntilEmpty <= 60)
          .sort((a, b) => a.daysUntilEmpty - b.daysUntilEmpty)
          .slice(0, 15);
        setLowStockItems(low);
      }

      // Inventory calculations
      if (itemsData && categories) {
        const enrichedItems = itemsData.map(item => {
          const cat = categories.find(c => c.id === item.category_id);
          const cost = (item.cost_per_gram || 0) * (item.current_weight_grams || 0);
          const retail = (item.price_crc || 0) * (item.current_weight_grams || 0);
          const margin = retail - cost;
          const marginPct = cost > 0 ? (margin / cost) * 100 : 0;
          const depletion = item.depletion_rate_grams_per_day || 0;
          const daysLeft = depletion > 0 ? Math.round((item.current_weight_grams || 0) / depletion) : 999;
          
          return {
            ...item,
            category_name: cat?.name || 'Uncategorized',
            category_name_es: cat?.name_es || null,
            cost,
            retail,
            margin,
            marginPct,
            depletion,
            daysLeft,
            stockKg: ((item.current_weight_grams || 0) / 1000).toFixed(3)
          };
        });
        setItems(enrichedItems);
      }
    } catch (err) { console.error('Error:', err); }
    finally { setLoading(false); }
  };

  const handleExport = (type: string) => {
    let csv = '';
    if (type === 'inventory') {
      csv = 'SKU,Name,Category,Stock (kg),Cost/g,Retail/g,Cost Value,Retail Value,Margin,Margin %,Depletion Rate,Days Left\n';
      items.forEach(i => {
        csv += `${i.sku || ''},${i.name},${i.category_name},${i.stockKg},${i.cost_per_gram || 0},${i.price_crc || 0},${i.cost.toFixed(2)},${i.retail.toFixed(2)},${i.margin.toFixed(2)},${i.marginPct.toFixed(1)},${i.depletion},${i.daysLeft}\n`;
      });
    } else if (type === 'sales') {
      csv = 'Date,Items,Total,Payment Method,Device\n';
      sales.forEach(s => {
        csv += `${s.sale_date},${s.items_sold?.length || 0},${s.total_crc},${s.payment_method},${s.device_id || ''}\n`;
      });
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `${type}_report_${dateFrom}_${dateTo}.csv`;
    a.click();
  };

  return (
    <DashboardLayout currentPage="reports">
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <AssessmentIcon sx={{ fontSize: 32, color: COLORS.primary }} />
          <Typography variant="h4" sx={{ color: COLORS.primary, fontWeight: 'bold' }}>Reportes / Reports</Typography>
        </Box>

        {/* Date Filters */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField type="date" label="Desde / From" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 140 }} size="small" />
            <TextField type="date" label="Hasta / To" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 140 }} size="small" />
            <Button variant="contained" onClick={fetchAllData} sx={{ bgcolor: COLORS.primary }}>Actualizar / Update</Button>
          </Box>
        </Paper>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Resumen / Summary" />
          <Tab label="Inventario / Inventory" />
          <Tab label="Ventas / Sales" />
          <Tab label="Top Vendidos / Top Sellers" />
          <Tab label="Movimiento Lento / Slow Movers" />
          <Tab label="Stock Bajo / Low Stock" />
        </Tabs>

        {loading && <Typography sx={{ p: 3 }}>Cargando / Loading...</Typography>}

        {/* SUMMARY TAB */}
        <TabPanel value={tab} index={0}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ bgcolor: COLORS.primary, color: 'white' }}>
                <CardContent><Typography variant="body2" sx={{ opacity: 0.8 }}>Ingresos / Revenue</Typography><Typography variant="h4" fontWeight="bold">{formatCurrency(salesSummary.revenue)}</Typography></CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card><CardContent><Typography variant="body2" color="text.secondary">Transacciones</Typography><Typography variant="h4" fontWeight="bold">{salesSummary.count}</Typography></CardContent></Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card><CardContent><Typography variant="body2" color="text.secondary">Venta Promedio / Avg Sale</Typography><Typography variant="h4" fontWeight="bold">{formatCurrency(salesSummary.avgSale)}</Typography></CardContent></Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ bgcolor: COLORS.success, color: 'white' }}>
                <CardContent><Typography variant="body2" sx={{ opacity: 0.8 }}>Ganancia Bruta / Gross Profit</Typography><Typography variant="h4" fontWeight="bold">{formatCurrency(salesSummary.grossProfit)}</Typography></CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card><CardContent><Typography variant="body2" color="text.secondary">Costo Goods / COGS</Typography><Typography variant="h5" fontWeight="bold">{formatCurrency(salesSummary.cogs)}</Typography></CardContent></Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card><CardContent><Typography variant="body2" color="text.secondary">Artículos bajo stock</Typography><Typography variant="h4" fontWeight="bold" sx={{ color: lowStockItems.length > 0 ? COLORS.warning : COLORS.success }}>{lowStockItems.length}</Typography></CardContent></Card>
            </Grid>
          </Grid>

          <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>Por Método de Pago / By Payment Method</Typography>
          <Grid container spacing={2}>
            {Object.entries(paymentBreakdown).map(([method, amount]) => (
              <Grid size={{ xs: 6, sm: 3 }} key={method}>
                <Card variant="outlined"><CardContent sx={{ textAlign: 'center' }}>
                  <Typography sx={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{method}</Typography>
                  <Typography variant="h5" sx={{ color: COLORS.primary }}>{formatCurrency(amount)}</Typography>
                </CardContent></Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* INVENTORY TAB */}
        <TabPanel value={tab} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button startIcon={<Download />} onClick={() => handleExport('inventory')} variant="contained">Export CSV</Button>
          </Box>
          <TableContainer sx={{ maxHeight: '70vh' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Categoría</TableCell>
                  <TableCell>Artículo</TableCell>
                  <TableCell align="right">Stock (kg)</TableCell>
                  <TableCell align="right">Costo/g</TableCell>
                  <TableCell align="right">Venta/g</TableCell>
                  <TableCell align="right">Valor Costo</TableCell>
                  <TableCell align="right">Valor Venta</TableCell>
                  <TableCell align="right">Margen</TableCell>
                  <TableCell align="right">Margen %</TableCell>
                  <TableCell align="right">Días Quedan</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, idx) => (
                  <TableRow key={idx} sx={{ bgcolor: item.daysLeft <= 30 ? `${COLORS.error}15` : item.daysLeft <= 60 ? `${COLORS.warning}15` : 'inherit' }}>
                    <TableCell>{item.category_name}{item.category_name_es ? ` / ${item.category_name_es}` : ''}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{item.name}</TableCell>
                    <TableCell align="right">{item.stockKg}</TableCell>
                    <TableCell align="right">{formatCurrency(item.cost_per_gram || 0)}</TableCell>
                    <TableCell align="right">{formatCurrency(item.price_crc || 0)}</TableCell>
                    <TableCell align="right">{formatCurrency(item.cost)}</TableCell>
                    <TableCell align="right">{formatCurrency(item.retail)}</TableCell>
                    <TableCell align="right" sx={{ color: item.margin >= 0 ? COLORS.success : COLORS.error, fontWeight: 'bold' }}>{formatCurrency(item.margin)}</TableCell>
                    <TableCell align="right" sx={{ color: item.marginPct >= 0 ? COLORS.success : COLORS.error, fontWeight: 'bold' }}>{item.marginPct.toFixed(1)}%</TableCell>
                    <TableCell align="right">
                      <Chip label={item.daysLeft <= 30 ? `🔴 ${item.daysLeft}` : item.daysLeft <= 60 ? `🟠 ${item.daysLeft}` : `🟢 ${item.daysLeft}`} size="small" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* SALES TAB */}
        <TabPanel value={tab} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button startIcon={<Download />} onClick={() => handleExport('sales')} variant="contained">Export CSV</Button>
          </Box>
          <TableContainer sx={{ maxHeight: '70vh' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Fecha / Date</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell>Método / Method</TableCell>
                  <TableCell>Dispositivo / Device</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sales.map((sale, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{new Date(sale.sale_date).toLocaleString()}</TableCell>
                    <TableCell>{sale.items_sold?.length || 0}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatCurrency(sale.total_crc)}</TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>{sale.payment_method}</TableCell>
                    <TableCell>{sale.device_id?.slice(0, 8) || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* TOP SELLERS TAB */}
        <TabPanel value={tab} index={3}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Artículo / Item</TableCell>
                  <TableCell align="right">Cantidad (g)</TableCell>
                  <TableCell align="right">Ingresos / Revenue</TableCell>
                  <TableCell align="right">Margen / Margin</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topItems.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell sx={{ fontWeight: 'bold', color: idx < 3 ? COLORS.secondary : 'inherit' }}>{idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{item.name}</TableCell>
                    <TableCell align="right">{item.qty.toLocaleString()}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatCurrency(item.revenue)}</TableCell>
                    <TableCell align="right" sx={{ color: COLORS.success }}>{formatCurrency(item.revenue - item.cost)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>Mayor Ganancia / Highest Margin</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Artículo / Item</TableCell>
                  <TableCell align="right">Ingresos / Revenue</TableCell>
                  <TableCell align="right">Costo / Cost</TableCell>
                  <TableCell align="right">Ganancia / Profit</TableCell>
                  <TableCell align="right">Margen %</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topMargin.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell sx={{ fontWeight: 'bold' }}>{item.name}</TableCell>
                    <TableCell align="right">{formatCurrency(item.revenue)}</TableCell>
                    <TableCell align="right">{formatCurrency(item.cost)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: COLORS.success }}>{formatCurrency(item.margin)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: item.marginPct > 50 ? COLORS.success : COLORS.warning }}>{item.marginPct.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* SLOW MOVERS TAB */}
        <TabPanel value={tab} index={4}>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>Artículos con menor rotación / Items with lowest sales quantity</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Artículo / Item</TableCell>
                  <TableCell align="right">Cantidad Vendida / Qty Sold</TableCell>
                  <TableCell align="right">Ingresos / Revenue</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {slowItems.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell sx={{ fontWeight: 'bold' }}>{item.name}</TableCell>
                    <TableCell align="right">{item.qty}g</TableCell>
                    <TableCell align="right" sx={{ color: COLORS.warning }}>{formatCurrency(item.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* LOW STOCK TAB */}
        <TabPanel value={tab} index={5}>
          <Typography variant="h5" sx={{ mb: 2, color: COLORS.warning }}>⚠️ Alerta Stock Bajo / Low Stock Alert (60 días o menos / or less)</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Artículo / Item</TableCell>
                  <TableCell>Categoría / Category</TableCell>
                  <TableCell align="right">Stock (g)</TableCell>
                  <TableCell align="right">Stock (kg)</TableCell>
                  <TableCell align="right">Días Quedan / Days Left</TableCell>
                  <TableCell>Recomendación / Recommendation</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lowStockItems.map((item, idx) => (
                  <TableRow key={idx} sx={{ bgcolor: item.daysUntilEmpty <= 30 ? `${COLORS.error}20` : `${COLORS.warning}20` }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>{item.name}</TableCell>
                    <TableCell>{item.category_name}</TableCell>
                    <TableCell align="right">{item.current_weight_grams}g</TableCell>
                    <TableCell align="right">{item.stockKg}kg</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: item.daysUntilEmpty <= 30 ? COLORS.error : COLORS.warning }}>{item.daysUntilEmpty} días</TableCell>
                    <TableCell>{item.daysUntilEmpty <= 30 ? '🔴 Ordene URGENTE / Order ASAP' : '🟠 Ordene pronto / Order soon'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Box>
    </DashboardLayout>
  );
}