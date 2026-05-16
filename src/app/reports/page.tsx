'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Box, Typography, Card, CardContent, Grid, Paper, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Button, Tabs, Tab, Chip, Alert, Snackbar
} from '@mui/material';
import { Assessment as AssessmentIcon, Download, Info } from '@mui/icons-material';
import { api, calculateSalesByCategory, calculateSalesBySubcategory, calculateSalesByMineralType } from '@/lib/api';
import { formatCurrency } from '@/utils/format';
import { COLORS } from '@/lib/constants';
import DashboardLayout from '@/components/DashboardLayout';
import { Sale, Item, Category, Subcategory } from '@/types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index} style={{ display: value !== index ? 'none' : 'block' }}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

interface SalesSummary {
  revenue: number;
  count: number;
  avgSale: number;
  cogs: number;
  grossProfit: number;
}

export default function ReportsPage() {
  const [tab, setTab] = useState(0);
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0]; });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  
  const [sales, setSales] = useState<Sale[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  
  const [salesSummary, setSalesSummary] = useState<SalesSummary>({ revenue: 0, count: 0, avgSale: 0, cogs: 0, grossProfit: 0 });
  const [paymentBreakdown, setPaymentBreakdown] = useState<Record<string, number>>({});
  const [salesByCategory, setSalesByCategory] = useState<{ name: string; qty: number; revenue: number }[]>([]);
  const [salesBySubcategory, setSalesBySubcategory] = useState<{ name: string; categoryId: string; categoryName: string; qty: number; revenue: number }[]>([]);
  const [mineralTypeSales, setMineralTypeSales] = useState<{ name: string; mineralType: string; qty: number; revenue: number; categories: string }[]>([]);
  const [topItems, setTopItems] = useState<{ id: string; name: string; qty: number; revenue: number; cost: number }[]>([]);
  const [lowStockItems, setLowStockItems] = useState<(Item & { daysLeft: number })[]>([]);

  useEffect(() => { fetchAllData(); }, [dateFrom, dateTo]);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [salesData, itemsData, catsData, subsData] = await Promise.all([
        api.fetchSales(dateFrom, dateTo, 1000),
        api.fetchItems({ isActive: true }),
        api.fetchCategories(true),
        api.fetchSubcategories(true),
      ]);
      
      setSales(salesData || []);
      setItems(itemsData || []);
      setCategories(catsData || []);
      setSubcategories(subsData || []);
      
      calculateMetrics(salesData || [], itemsData || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(msg);
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (salesData: Sale[], itemsData: Item[]) => {
    const totalRevenue = salesData.reduce((sum, s) => sum + (s.total_crc || 0), 0);
    const count = salesData.length;
    
    const payments: Record<string, number> = { cash: 0, sinpe: 0, card: 0, lightning: 0 };
    const itemsMap: Record<string, Item> = {};
    itemsData.forEach(item => { itemsMap[item.id] = item; });
    
    let totalCOGS = 0;
    const itemSalesMap: Record<string, { name: string; qty: number; revenue: number; cost: number }> = {};
    
    salesData.forEach(sale => {
      const method = (sale.payment_method || 'cash') as string;
      if (payments[method] !== undefined) {
        payments[method] = (payments[method] || 0) + (sale.total_crc || 0);
      }
      
      (sale.items_sold || []).forEach(sold => {
        const itemData = itemsMap[sold.item_id];
        const cost = (itemData?.cost_per_gram || 0) * (sold.qty_grams || 0);
        totalCOGS += cost;
        
        if (!itemSalesMap[sold.item_id]) {
          itemSalesMap[sold.item_id] = { name: sold.name, qty: 0, revenue: 0, cost: 0 };
        }
        itemSalesMap[sold.item_id].qty += sold.qty_grams || 0;
        itemSalesMap[sold.item_id].revenue += sold.price || 0;
        itemSalesMap[sold.item_id].cost += cost;
      });
    });

    setSalesSummary({
      revenue: totalRevenue,
      count,
      avgSale: count > 0 ? totalRevenue / count : 0,
      cogs: totalCOGS,
      grossProfit: totalRevenue - totalCOGS
    });
    setPaymentBreakdown(payments);
    
    const byCategory = calculateSalesByCategory(salesData, itemsData, categories);
    setSalesByCategory(byCategory);
    
    const bySubcategory = calculateSalesBySubcategory(salesData, itemsData, subcategories, categories);
    setSalesBySubcategory(bySubcategory);
    
    const byMineralType = calculateSalesByMineralType(salesData, itemsData, subcategories, categories);
    setMineralTypeSales(byMineralType);
    
    const top = Object.values(itemSalesMap)
      .map((data, idx) => ({ id: String(idx), ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 15);
    setTopItems(top);
    
    const lowStock = itemsData
      .filter(i => i.is_active && (i.current_weight_grams || 0) > 0 && (i.current_weight_grams || 0) < (i.min_threshold_grams || 100))
      .map(item => {
        const depletion = item.depletion_rate_grams_per_day || 0;
        const daysLeft = depletion > 0 ? Math.round((item.current_weight_grams || 0) / depletion) : 999;
        return { ...item, daysLeft };
      })
      .sort((a, b) => (a.current_weight_grams || 0) - (b.current_weight_grams || 0))
      .slice(0, 15);
    setLowStockItems(lowStock);
  };

  const handleExport = (type: string) => {
    let csv = '';
    if (type === 'sales') {
      csv = 'Date,Items,Total,Payment Method,Device\n';
      sales.forEach(s => {
        csv += `${s.sale_date},${s.items_sold?.length || 0},${s.total_crc},${s.payment_method},${s.device_id || ''}\n`;
      });
    } else if (type === 'categories') {
      csv = 'Category,Quantity (g),Revenue\n';
      salesByCategory.forEach(c => {
        csv += `${c.name},${c.qty},${c.revenue}\n`;
      });
    } else if (type === 'minerals') {
      csv = 'Mineral Type,Categories (Product Forms),Quantity (g),Revenue\n';
      mineralTypeSales.forEach(m => {
        csv += `${m.mineralType},${m.categories},${m.qty},${m.revenue}\n`;
      });
    }
    
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `${type}_report_${dateFrom}_${dateTo}.csv`;
    a.click();
    setSnackbar({ open: true, message: `Exported ${type} report`, severity: 'success' });
  };

  const enrichedItems = useMemo(() => {
    return items.map(item => {
      const cat = categories.find(c => c.id === item.category_id);
      const cost = (item.cost_per_gram || 0) * (item.current_weight_grams || 0);
      const retail = (item.price_crc || 0) * (item.current_weight_grams || 0);
      return {
        ...item,
        category_name: cat?.name || 'Uncategorized',
        cost,
        retail,
        margin: retail - cost,
        marginPct: cost > 0 ? ((retail - cost) / cost) * 100 : 0,
        daysLeft: item.depletion_rate_grams_per_day > 0 
          ? Math.round((item.current_weight_grams || 0) / item.depletion_rate_grams_per_day) 
          : 999,
        stockKg: ((item.current_weight_grams || 0) / 1000).toFixed(3)
      };
    });
  }, [items, categories]);

  return (
    <DashboardLayout currentPage="reports">
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <AssessmentIcon sx={{ fontSize: 32, color: COLORS.primary }} />
          <Typography variant="h4" sx={{ color: COLORS.primary, fontWeight: 'bold' }}>Reportes / Reports</Typography>
        </Box>

        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField type="date" label="Desde / From" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 140 }} size="small" />
            <TextField type="date" label="Hasta / To" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 140 }} size="small" />
            <Button variant="contained" onClick={fetchAllData} sx={{ bgcolor: COLORS.primary }} disabled={loading}>
              {loading ? 'Cargando...' : 'Actualizar'}
            </Button>
            <Button variant="outlined" startIcon={<Download />} onClick={() => handleExport('categories')}>Export Categories</Button>
            <Button variant="outlined" startIcon={<Download />} onClick={() => handleExport('minerals')}>Export Minerals</Button>
          </Box>
        </Paper>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Resumen / Summary" />
          <Tab label="Inventario / Inventory" />
          <Tab label="Ventas / Sales" />
          <Tab label="Formas (Categorías)" />
          <Tab label="Tipos de Mineral" />
          <Tab label="Stock Bajo / Low Stock" />
        </Tabs>

        <TabPanel value={tab} index={0}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ bgcolor: COLORS.primary, color: 'white' }}>
                <CardContent>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>Ingresos / Revenue</Typography>
                  <Typography variant="h4" fontWeight="bold">{formatCurrency(salesSummary.revenue)}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Transacciones</Typography>
                  <Typography variant="h4" fontWeight="bold">{salesSummary.count}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Venta Promedio</Typography>
                  <Typography variant="h4" fontWeight="bold">{formatCurrency(salesSummary.avgSale)}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ bgcolor: COLORS.success, color: 'white' }}>
                <CardContent>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>Ganancia Bruta</Typography>
                  <Typography variant="h4" fontWeight="bold">{formatCurrency(salesSummary.grossProfit)}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Costo Goods / COGS</Typography>
                  <Typography variant="h5" fontWeight="bold">{formatCurrency(salesSummary.cogs)}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Artículos bajo stock</Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: lowStockItems.length > 0 ? COLORS.warning : COLORS.success }}>
                    {lowStockItems.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>Por Método de Pago</Typography>
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
        </TabPanel>

        <TabPanel value={tab} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button startIcon={<Download />} onClick={() => {
              let csv = 'SKU,Name,Category,Stock (kg),Cost/g,Retail/g,Cost Value,Retail Value,Margin,Margin %,Días Quedan\n';
              enrichedItems.forEach(i => {
                csv += `${i.sku || ''},${i.name},${i.category_name},${i.stockKg},${i.cost_per_gram || 0},${i.price_crc || 0},${i.cost.toFixed(2)},${i.retail.toFixed(2)},${i.margin.toFixed(2)},${i.marginPct.toFixed(1)},${i.daysLeft}\n`;
              });
              const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `inventory_${dateFrom}_${dateTo}.csv`; a.click();
            }} variant="contained">Export CSV</Button>
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
                  <TableCell align="right">Margen %</TableCell>
                  <TableCell align="right">Días Quedan</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {enrichedItems.map((item, idx) => (
                  <TableRow key={idx} sx={{ bgcolor: item.daysLeft <= 30 ? `${COLORS.error}15` : item.daysLeft <= 60 ? `${COLORS.warning}15` : 'inherit' }}>
                    <TableCell>{item.category_name}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{item.name}</TableCell>
                    <TableCell align="right">{item.stockKg}</TableCell>
                    <TableCell align="right">{formatCurrency(item.cost_per_gram || 0)}</TableCell>
                    <TableCell align="right">{formatCurrency(item.price_crc || 0)}</TableCell>
                    <TableCell align="right">{formatCurrency(item.cost)}</TableCell>
                    <TableCell align="right">{formatCurrency(item.retail)}</TableCell>
                    <TableCell align="right" sx={{ color: item.margin >= 0 ? COLORS.success : COLORS.error, fontWeight: 'bold' }}>{item.marginPct.toFixed(1)}%</TableCell>
                    <TableCell align="right">
                      <Chip label={item.daysLeft <= 30 ? `🔴 ${item.daysLeft}` : item.daysLeft <= 60 ? `🟠 ${item.daysLeft}` : `🟢 ${item.daysLeft}`} size="small" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

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
                  <TableCell>Método</TableCell>
                  <TableCell>Dispositivo</TableCell>
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

        <TabPanel value={tab} index={3}>
          <Alert severity="info" sx={{ mb: 2 }} icon={<Info />}>
            <Typography variant="body2">
              <strong>Categorías</strong> = Formas de producto (Puntos, Torres, Clusters, Floreros, etc.)<br/>
              <strong>Subcategorías</strong> = Tipos de mineral (Amatista, Cuarzo Transparente, Citrino, Cuarzo Rosa, etc.)
            </Typography>
          </Alert>
          
          <Typography variant="h5" sx={{ mb: 2, color: COLORS.primary, fontWeight: 'bold' }}>📦 Ventas por Forma de Producto (Categoría)</Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {salesByCategory.map((cat, idx) => (
              <Grid key={idx} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card sx={{ bgcolor: idx === 0 ? COLORS.primary : idx === 1 ? COLORS.secondary : 'white', color: idx < 2 ? 'white' : 'inherit' }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold">{cat.name}</Typography>
                    <Typography variant="h4" fontWeight="bold">{formatCurrency(cat.revenue)}</Typography>
                    <Typography variant="body2">{cat.qty.toLocaleString()}g vendido</Typography>
                    <Typography variant="body2">
                      {salesSummary.revenue > 0 ? ((cat.revenue / salesSummary.revenue) * 100).toFixed(1) : 0}% del total
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ bgcolor: COLORS.primary }}>
                <TableRow>
                  <TableCell sx={{ color: 'white' }}>#</TableCell>
                  <TableCell sx={{ color: 'white' }}>Forma de Producto</TableCell>
                  <TableCell sx={{ color: 'white' }} align="right">Cantidad (g)</TableCell>
                  <TableCell sx={{ color: 'white' }} align="right">Ingresos</TableCell>
                  <TableCell sx={{ color: 'white' }} align="right">% del Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {salesByCategory.map((cat, idx) => (
                  <TableRow key={idx} sx={{ bgcolor: idx < 3 ? `${COLORS.secondary}10` : 'inherit' }}>
                    <TableCell sx={{ fontWeight: idx < 3 ? 'bold' : 'inherit' }}>{idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: idx < 3 ? 'bold' : 'inherit' }}>{cat.name}</TableCell>
                    <TableCell align="right">{cat.qty.toLocaleString()}g</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatCurrency(cat.revenue)}</TableCell>
                    <TableCell align="right">{salesSummary.revenue > 0 ? ((cat.revenue / salesSummary.revenue) * 100).toFixed(1) : 0}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {salesBySubcategory.length > 0 && (
            <>
              <Typography variant="h5" sx={{ mt: 4, mb: 2, color: COLORS.accent, fontWeight: 'bold' }}>💠 Por Subcategoría (Forma + Mineral)</Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: COLORS.accent }}>
                    <TableRow>
                      <TableCell sx={{ color: 'white' }}>Subcategoría</TableCell>
                      <TableCell sx={{ color: 'white' }}>Categoría</TableCell>
                      <TableCell sx={{ color: 'white' }} align="right">Cantidad</TableCell>
                      <TableCell sx={{ color: 'white' }} align="right">Ingresos</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {salesBySubcategory.map((sub, idx) => (
                      <TableRow key={idx}>
                        <TableCell sx={{ fontWeight: 'bold' }}>{sub.name}</TableCell>
                        <TableCell>{sub.categoryName}</TableCell>
                        <TableCell align="right">{sub.qty.toLocaleString()}g</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatCurrency(sub.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </TabPanel>

        <TabPanel value={tab} index={4}>
          <Alert severity="success" sx={{ mb: 2 }} icon={<Info />}>
            <Typography variant="body2">
              <strong>Esta vista muestra qué TIPOS DE MINERAL son más populares,</strong><br/>
              independientemente de la forma del producto (punto, torre, cluster, etc.).<br/>
              Por ejemplo: "Amatista" aparece aunque se venda como punto, torre o cluster.
            </Typography>
          </Alert>
          
          <Typography variant="h5" sx={{ mb: 2, color: COLORS.success, fontWeight: 'bold' }}>💎 Tipos de Mineral Preferidos (Todas las Formas)</Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {mineralTypeSales.slice(0, 6).map((mineral, idx) => (
              <Grid key={idx} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card sx={{ 
                  bgcolor: idx === 0 ? COLORS.success : idx === 1 ? COLORS.secondary : COLORS.accent, 
                  color: 'white',
                  border: idx < 3 ? `3px solid ${COLORS.secondary}` : 'none'
                }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold">{mineral.mineralType}</Typography>
                    <Typography variant="h4" fontWeight="bold">{formatCurrency(mineral.revenue)}</Typography>
                    <Typography variant="body2">{mineral.qty.toLocaleString()}g vendido</Typography>
                    <Chip 
                      label={mineral.categories} 
                      size="small" 
                      sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ bgcolor: COLORS.success }}>
                <TableRow>
                  <TableCell sx={{ color: 'white' }}>#</TableCell>
                  <TableCell sx={{ color: 'white' }}>Tipo de Mineral</TableCell>
                  <TableCell sx={{ color: 'white' }}>Formas en que se Vende</TableCell>
                  <TableCell sx={{ color: 'white' }} align="right">Cantidad (g)</TableCell>
                  <TableCell sx={{ color: 'white' }} align="right">Ingresos</TableCell>
                  <TableCell sx={{ color: 'white' }} align="right">% del Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mineralTypeSales.map((mineral, idx) => (
                  <TableRow key={idx} sx={{ 
                    bgcolor: idx < 3 ? `${COLORS.success}15` : 'inherit',
                    '&:hover': { bgcolor: `${COLORS.primary}10` }
                  }}>
                    <TableCell sx={{ fontWeight: idx < 3 ? 'bold' : 'inherit' }}>{idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: idx < 3 ? 'bold' : 'inherit', color: idx < 3 ? COLORS.success : 'inherit' }}>
                      {idx < 3 && '🏆 '}{mineral.mineralType}
                    </TableCell>
                    <TableCell>
                      {mineral.categories.split(', ').map((cat, i) => (
                        <Chip key={i} label={cat} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                      ))}
                    </TableCell>
                    <TableCell align="right">{mineral.qty.toLocaleString()}g</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatCurrency(mineral.revenue)}</TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={salesSummary.revenue > 0 ? ((mineral.revenue / salesSummary.revenue) * 100).toFixed(1) + '%' : '0%'} 
                        color={idx < 3 ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {mineralTypeSales.length === 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              No se encontraron ventas con subcategorías asignadas. Asegúrate de que los artículos tengan una subcategoría (tipo de mineral) asignada.
            </Alert>
          )}
        </TabPanel>

        <TabPanel value={tab} index={5}>
          <Typography variant="h5" sx={{ mb: 2, color: COLORS.warning }}>⚠️ Alerta Stock Bajo (60 días o menos)</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Artículo</TableCell>
                  <TableCell>Categoría</TableCell>
                  <TableCell align="right">Stock (g)</TableCell>
                  <TableCell align="right">Stock (kg)</TableCell>
                  <TableCell align="right">Días Quedan</TableCell>
                  <TableCell>Recomendación</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lowStockItems.map((item, idx) => (
                  <TableRow key={idx} sx={{ bgcolor: item.daysLeft <= 30 ? `${COLORS.error}20` : `${COLORS.warning}20` }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>{item.name}</TableCell>
                    <TableCell>{categories.find(c => c.id === item.category_id)?.name || 'N/A'}</TableCell>
                    <TableCell align="right">{item.current_weight_grams}g</TableCell>
                    <TableCell align="right">{((item.current_weight_grams || 0) / 1000).toFixed(3)}kg</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: item.daysLeft <= 30 ? COLORS.error : COLORS.warning }}>
                      {item.daysLeft} días
                    </TableCell>
                    <TableCell>{item.daysLeft <= 30 ? '🔴 Ordene URGENTE' : '🟠 Ordene pronto'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {lowStockItems.length === 0 && (
            <Alert severity="success" sx={{ mt: 2 }}>✅ Todo el inventario está bien!</Alert>
          )}
        </TabPanel>
      </Box>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
}