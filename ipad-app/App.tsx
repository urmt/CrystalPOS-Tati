// =============================================================================
// CRYSTALPOS iPad App - SIMPLE TEST VERSION
// =============================================================================

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from './src/supabase';

const COLORS = { primary: '#6B4C9A', accent: '#20B2AA', success: '#228B22', warning: '#FFA500', background: '#F7F5F3' };

export default function App() {
  const [screen, setScreen] = useState('Dashboard');
  const [data, setData] = useState<any>({ sales: [], items: [], users: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Fetching from Supabase...');
      const [salesRes, itemsRes, usersRes] = await Promise.all([
        supabase.from('sales').select('*').order('sale_date', { ascending: false }).limit(10),
        supabase.from('items').select('*').order('name').limit(20),
        supabase.from('users').select('*'),
      ]);
      
      console.log('Sales:', salesRes.data?.length);
      console.log('Items:', itemsRes.data?.length);
      console.log('Users:', usersRes.data?.length);
      
      setData({
        sales: salesRes.data || [],
        items: itemsRes.data || [],
        users: usersRes.data || [],
      });
    } catch (e: any) {
      console.error('Error:', e);
      setError(e.message || 'Failed to connect to database');
    }
    setLoading(false);
  };

  // ============================================
  // DASHBOARD SCREEN
  // ============================================
  const Dashboard = () => {
    const todaySales = data.sales.filter((s: any) => {
      const saleDate = new Date(s.sale_date);
      const today = new Date();
      return saleDate.toDateString() === today.toDateString();
    });
    const todayRevenue = todaySales.reduce((sum: number, s: any) => sum + Number(s.total_crc || 0), 0);
    const lowStock = data.items.filter((i: any) => i.is_active && !i.deleted_at && (i.current_weight_grams || 0) < (i.min_threshold_grams || 100)).length;

    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>CrystalPOS</Text>
        <Text style={styles.subtitle}>Dashboard</Text>
        
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
            <Text style={styles.statValue}>₡{todayRevenue.toLocaleString('es-CR')}</Text>
            <Text style={styles.statLabel}>Today's Revenue</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: COLORS.primary }]}>{todaySales.length}</Text>
            <Text style={styles.statLabel}>Transactions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: lowStock > 0 ? COLORS.warning : COLORS.success }]}>{lowStock}</Text>
            <Text style={styles.statLabel}>Low Stock</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={[styles.actionBtn, { borderColor: COLORS.primary }]} onPress={() => setScreen('Sales')}>
            <Text style={styles.actionIcon}>🛒</Text>
            <Text style={styles.actionText}>New Sale</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { borderColor: COLORS.accent }]} onPress={() => setScreen('Inventory')}>
            <Text style={styles.actionIcon}>📦</Text>
            <Text style={styles.actionText}>Add Item</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Recent Sales</Text>
        {data.sales.slice(0, 5).map((sale: any) => (
          <View key={sale.id} style={styles.saleItem}>
            <Text>{new Date(sale.sale_date).toLocaleDateString()}</Text>
            <Text>₡{Number(sale.total_crc || 0).toLocaleString('es-CR')}</Text>
          </View>
        ))}
      </ScrollView>
    );
  };

  // ============================================
  // SALES SCREEN
  // ============================================
  const Sales = () => {
    const [cart, setCart] = useState<any[]>([]);
    const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

    const addToCart = (item: any) => {
      const weight = Math.min(item.current_weight_grams || 100, 250);
      const price = Math.round((item.price_crc || 0) / (item.current_weight_grams || 1) * weight);
      setCart([...cart, { ...item, cartId: Date.now().toString(), weight, price }]);
    };

    return (
      <View style={styles.salesContainer}>
        <View style={styles.productsPanel}>
          <Text style={styles.title}>Products</Text>
          <ScrollView>
            {data.items.map((item: any) => (
              <TouchableOpacity key={item.id} style={styles.productCard} onPress={() => addToCart(item)}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productSku}>{item.sku}</Text>
                <Text style={styles.productPrice}>₡{item.price_crc?.toLocaleString('es-CR')}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <View style={styles.cartPanel}>
          <Text style={styles.cartTitle}>Cart ({cart.length})</Text>
          {cart.length === 0 ? (
            <Text style={styles.emptyCart}>Tap products to add</Text>
          ) : (
            <>
              {cart.map((item: any) => (
                <View key={item.cartId} style={styles.cartItem}>
                  <Text>{item.name}</Text>
                  <Text>₡{item.price.toLocaleString('es-CR')}</Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>₡{cartTotal.toLocaleString('es-CR')}</Text>
              </View>
              <View style={styles.paymentButtons}>
                <TouchableOpacity style={[styles.payBtn, { backgroundColor: COLORS.accent }]}><Text style={styles.payBtnText}>SINPE</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.payBtn, { backgroundColor: COLORS.success }]}><Text style={styles.payBtnText}>Cash</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.payBtn, { backgroundColor: COLORS.primary }]}><Text style={styles.payBtnText}>Card</Text></TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    );
  };

  // ============================================
  // INVENTORY SCREEN
  // ============================================
  const Inventory = () => {
    const getStockStatus = (item: any) => {
      if ((item.current_weight_grams || 0) <= 0) return 'error';
      if ((item.current_weight_grams || 0) < (item.min_threshold_grams || 100) * 0.1) return 'error';
      if ((item.current_weight_grams || 0) < (item.min_threshold_grams || 100)) return 'warning';
      return 'success';
    };

    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Inventory</Text>
        <Text style={styles.itemCount}>{data.items.length} items</Text>
        
        {data.items.slice(0, 20).map((item: any) => {
          const status = getStockStatus(item);
          return (
            <View key={item.id} style={styles.inventoryItem}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemSku}>{item.sku}</Text>
              </View>
              <View style={styles.itemStock}>
                <Text>{item.current_weight_grams}g</Text>
                <Text style={{ color: status === 'success' ? COLORS.success : status === 'warning' ? COLORS.warning : COLORS.warning }}>{status.toUpperCase()}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  // ============================================
  // SETTINGS SCREEN
  // ============================================
  const Settings = () => (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Text>Email: admin@crystalmarket.com</Text>
        <Text>Role: Systems Manager</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>
        <Text>Items: {data.items.length}</Text>
        <Text>Sales: {data.sales.length}</Text>
        <Text>Users: {data.users.length}</Text>
      </View>
      
      <TouchableOpacity style={styles.syncBtn} onPress={fetchData}>
        <Text style={styles.syncBtnText}>Sync Now</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // ============================================
  // RENDER
  // ============================================
  if (loading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (error) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <Text style={[styles.errorText, { color: COLORS.warning }]}>Error: {error}</Text>
          <TouchableOpacity style={styles.syncBtn} onPress={fetchData}>
            <Text style={styles.syncBtnText}>Retry</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>CrystalPOS</Text>
        </View>
        
        {/* Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity style={[styles.tab, screen === 'Dashboard' && styles.activeTab]} onPress={() => setScreen('Dashboard')}>
            <Text style={[styles.tabText, screen === 'Dashboard' && styles.activeTabText]}>Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, screen === 'Sales' && styles.activeTab]} onPress={() => setScreen('Sales')}>
            <Text style={[styles.tabText, screen === 'Sales' && styles.activeTabText]}>Sales</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, screen === 'Inventory' && styles.activeTab]} onPress={() => setScreen('Inventory')}>
            <Text style={[styles.tabText, screen === 'Inventory' && styles.activeTabText]}>Inventory</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, screen === 'Settings' && styles.activeTab]} onPress={() => setScreen('Settings')}>
            <Text style={[styles.tabText, screen === 'Settings' && styles.activeTabText]}>Settings</Text>
          </TouchableOpacity>
        </View>
        
        {/* Screen Content */}
        {screen === 'Dashboard' && <Dashboard />}
        {screen === 'Sales' && <Sales />}
        {screen === 'Inventory' && <Inventory />}
        {screen === 'Settings' && <Settings />}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const COLORS2 = { primary: '#6B4C9A', background: '#F7F5F3' };
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS2.background },
  content: { padding: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 20, fontSize: 16 },
  errorText: { fontSize: 16, textAlign: 'center', padding: 20 },
  
  // Header
  header: { padding: 15, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
  
  // Tab Bar
  tabBar: { flexDirection: 'row', backgroundColor: 'white', padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  tab: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: '#666' },
  activeTabText: { color: 'white' },
  
  // Dashboard
  title: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, padding: 20, backgroundColor: 'white', borderRadius: 12, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  statLabel: { fontSize: 12, opacity: 0.8, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10, marginTop: 20 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: { width: '45%', padding: 20, borderWidth: 2, borderRadius: 12, alignItems: 'center', backgroundColor: 'white' },
  actionIcon: { fontSize: 28 },
  actionText: { fontSize: 14, fontWeight: '600', marginTop: 8, color: '#333' },
  saleItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: 'white', borderRadius: 8, marginBottom: 10 },
  
  // Sales
  salesContainer: { flex: 1, flexDirection: 'row' },
  productsPanel: { flex: 2 },
  cartPanel: { flex: 1, backgroundColor: 'white', padding: 15, borderLeftWidth: 1, borderLeftColor: '#eee' },
  productCard: { padding: 15, backgroundColor: 'white', borderRadius: 12, margin: 5, alignItems: 'center' },
  productName: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  productSku: { fontSize: 10, color: '#999' },
  productPrice: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary, marginTop: 4 },
  cartTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  emptyCart: { color: '#999', textAlign: 'center', marginTop: 50 },
  cartItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee' },
  totalLabel: { fontSize: 18, fontWeight: 'bold' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  paymentButtons: { flexDirection: 'row', gap: 5, marginTop: 20 },
  payBtn: { flex: 1, padding: 15, borderRadius: 8, alignItems: 'center' },
  payBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  
  // Inventory
  itemCount: { fontSize: 14, color: '#666', marginBottom: 20 },
  inventoryItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: 'white', borderRadius: 8, marginBottom: 10 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '600' },
  itemSku: { fontSize: 12, color: '#999' },
  itemStock: { alignItems: 'flex-end' },
  
  // Settings
  section: { marginBottom: 20, padding: 15, backgroundColor: 'white', borderRadius: 12 },
  syncBtn: { padding: 15, backgroundColor: COLORS.primary, borderRadius: 8, alignItems: 'center' },
  syncBtnText: { color: 'white', fontWeight: 'bold' },
});