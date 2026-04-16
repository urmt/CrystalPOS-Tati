// =============================================================================
// SALES SCREEN
// =============================================================================

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { Card, Searchbar, Chip, Button, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../supabase';

const COLORS = { primary: '#6B4C9A', accent: '#20B2AA', success: '#228B22', background: '#F7F5F3' };

interface Item {
  id: string;
  sku: string;
  name: string;
  price_crc: number;
  current_weight_grams: number;
  category_id: string;
}

interface CartItem extends Item {
  cartId: string;
  weight: number;
  price: number;
}

export default function SalesScreen() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsRes, catsRes] = await Promise.all([
        supabase.from('items').select('*').eq('is_active', true).order('name'),
        supabase.from('categories').select('*').order('display_order'),
      ]);
      if (itemsRes.data) setItems(itemsRes.data as Item[]);
      if (catsRes.data) setCategories(catsRes.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || item.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (item: Item) => {
    const weight = Math.min(item.current_weight_grams || 100, 250);
    const unitPrice = item.price_crc / (item.current_weight_grams || 1);
    const price = Math.round(unitPrice * weight);
    setCart([...cart, { ...item, cartId: Date.now().toString(), weight, price }]);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>New Sale</Text>
        <View style={styles.headerRight}>
          <Text style={styles.cartBadge}>{cart.length}</Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Products Panel */}
        <View style={styles.productsPanel}>
          <Searchbar
            placeholder="Search products..."
            value={search}
            onChangeText={setSearch}
            style={styles.searchbar}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            <Chip selected={!selectedCategory} onPress={() => setSelectedCategory('')} style={styles.chip}>All</Chip>
            {categories.map(cat => (
              <Chip key={cat.id} selected={selectedCategory === cat.id} onPress={() => setSelectedCategory(cat.id)} style={styles.chip}>
                {cat.name}
              </Chip>
            ))}
          </ScrollView>

          <FlatList
            data={filteredItems}
            keyExtractor={item => item.id}
            numColumns={3}
            contentContainerStyle={styles.productList}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.productCard} onPress={() => addToCart(item)}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productSku}>{item.sku}</Text>
                <Text style={styles.productPrice}>₡{item.price_crc?.toLocaleString('es-CR') || 0}</Text>
                <Text style={styles.productWeight}>{item.current_weight_grams}g</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Cart Panel */}
        <View style={styles.cartPanel}>
          <Text style={styles.cartTitle}>Cart ({cart.length})</Text>
          
          {cart.length === 0 ? (
            <Text style={styles.emptyCart}>Cart is empty</Text>
          ) : (
            <FlatList
              data={cart}
              keyExtractor={item => item.cartId}
              renderItem={({ item }) => (
                <View style={styles.cartItem}>
                  <Text style={styles.cartItemName}>{item.name}</Text>
                  <Text style={styles.cartItemWeight}>{item.weight}g</Text>
                  <Text style={styles.cartItemPrice}>₡{item.price.toLocaleString('es-CR')}</Text>
                </View>
              )}
            />
          )}

          {cart.length > 0 && (
            <View style={styles.cartFooter}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>₡{cartTotal.toLocaleString('es-CR')}</Text>
              </View>
              
              <View style={styles.paymentButtons}>
                <Button mode="contained" style={{ backgroundColor: COLORS.accent }}>SINPE</Button>
                <Button mode="contained" style={{ backgroundColor: COLORS.success }}>Cash</Button>
                <Button mode="contained" style={{ backgroundColor: COLORS.primary }}>Card</Button>
              </View>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  headerRight: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  cartBadge: { color: 'white', fontWeight: 'bold' },
  content: { flex: 1, flexDirection: 'row' },
  productsPanel: { flex: 2 },
  searchbar: { margin: 10, backgroundColor: 'white' },
  categoryScroll: { paddingHorizontal: 10, marginBottom: 10 },
  chip: { marginRight: 8 },
  productList: { padding: 10 },
  productCard: { flex: 1, margin: 5, padding: 15, backgroundColor: 'white', borderRadius: 12, alignItems: 'center' },
  productName: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  productSku: { fontSize: 10, color: '#999', marginTop: 2 },
  productPrice: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary, marginTop: 8 },
  productWeight: { fontSize: 12, color: '#666', marginTop: 4 },
  cartPanel: { flex: 1, backgroundColor: 'white', borderLeftWidth: 1, borderLeftColor: '#eee', padding: 15 },
  cartTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  emptyCart: { color: '#999', textAlign: 'center', marginTop: 50 },
  cartItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  cartItemName: { flex: 1, fontSize: 14 },
  cartItemWeight: { fontSize: 12, color: '#666', marginHorizontal: 10 },
  cartItemPrice: { fontSize: 14, fontWeight: 'bold' },
  cartFooter: { marginTop: 'auto', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  totalLabel: { fontSize: 18, fontWeight: 'bold' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  paymentButtons: { flexDirection: 'row', gap: 5 },
});