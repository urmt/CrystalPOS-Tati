// =============================================================================
// DASHBOARD SCREEN
// =============================================================================

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card, Button, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../supabase';

const COLORS = { primary: '#6B4C9A', secondary: '#D4AF37', accent: '#20B2AA', background: '#F7F5F3' };

export default function DashboardScreen() {
  const [sales, setSales] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [salesRes, itemsRes] = await Promise.all([
        supabase.from('sales').select('*').order('sale_date', { ascending: false }).limit(10),
        supabase.from('items').select('*').order('name'),
      ]);
      if (salesRes.data) setSales(salesRes.data);
      if (itemsRes.data) setItems(itemsRes.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const todaySales = sales.filter(s => {
    const saleDate = new Date(s.sale_date);
    const today = new Date();
    return saleDate.toDateString() === today.toDateString();
  });

  const todayRevenue = todaySales.reduce((sum, s) => sum + Number(s.total_crc), 0);
  const lowStock = items.filter(i => i.is_active && i.current_weight_grams < i.min_threshold_grams).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>CrystalPOS</Text>
        <Text style={styles.subtitle}>Dashboard</Text>

        <View style={styles.statsRow}>
          <Card style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
            <Card.Content>
              <Text style={styles.statValue}>₡{todayRevenue.toLocaleString('es-CR')}</Text>
              <Text style={styles.statLabel}>Today's Revenue</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content>
              <Text style={[styles.statValue, { color: COLORS.primary }]}>{todaySales.length}</Text>
              <Text style={styles.statLabel}>Transactions</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content>
              <Text style={[styles.statValue, { color: lowStock > 0 ? '#FFA500' : '#228B22' }]}>{lowStock}</Text>
              <Text style={styles.statLabel}>Low Stock</Text>
            </Card.Content>
          </Card>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={[styles.actionBtn, { borderColor: COLORS.primary }]}>
            <Text style={styles.actionIcon}>🛒</Text>
            <Text style={styles.actionText}>New Sale</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { borderColor: COLORS.accent }]}>
            <Text style={styles.actionIcon}>📦</Text>
            <Text style={styles.actionText}>Add Item</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { borderColor: COLORS.secondary }]}>
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionText}>Reports</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: 'white' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  statLabel: { fontSize: 12, opacity: 0.8, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: { width: '30%', padding: 20, borderWidth: 2, borderRadius: 12, alignItems: 'center', backgroundColor: 'white' },
  actionIcon: { fontSize: 28 },
  actionText: { fontSize: 14, fontWeight: '600', marginTop: 8, color: '#333' },
});