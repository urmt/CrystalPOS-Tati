// =============================================================================
// INVENTORY SCREEN WITH CAMERA - FIXED
// =============================================================================

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity, Image, Alert, TextInput, Platform } from 'react-native';
import { Card, Searchbar, Chip, Button, FAB, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../supabase';

const COLORS = { primary: '#6B4C9A', accent: '#20B2AA', success: '#228B22', warning: '#FFA500', error: '#DC3545', background: '#F7F5F3' };

interface Item {
  id: string;
  sku: string;
  name: string;
  price_crc: number;
  current_weight_grams: number;
  min_threshold_grams: number;
  category_id: string;
  image_url: string | null;
}

interface Category {
  id: string;
  name: string;
}

export default function InventoryScreen() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<string>('all');
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [form, setForm] = useState({
    name: '', sku: '', price_crc: '0', current_weight_grams: '0',
    min_threshold_grams: '100', category_id: '', image_url: '', description: ''
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsRes, catsRes] = await Promise.all([
        supabase.from('items').select('*').order('name'),
        supabase.from('categories').select('*').order('display_order'),
      ]);
      if (itemsRes.data) setItems(itemsRes.data as Item[]);
      if (catsRes.data) setCategories(catsRes.data as Category[]);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const getStockStatus = (item: Item) => {
    if (item.current_weight_grams <= 0) return 'error';
    if (item.current_weight_grams < item.min_threshold_grams * 0.1) return 'error';
    if (item.current_weight_grams < item.min_threshold_grams) return 'warning';
    return 'success';
  };

  const filteredItems = items.filter(item => {
    if (item.deleted_at) return false;
    const matchesSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || item.category_id === selectedCategory;
    const status = getStockStatus(item);
    const matchesStock = stockFilter === 'all' || status === stockFilter;
    return matchesSearch && matchesCategory && matchesStock;
  });

  const stats = {
    total: items.filter(i => i.is_active && !i.deleted_at).length,
    low: items.filter(i => getStockStatus(i) === 'warning').length,
    out: items.filter(i => getStockStatus(i) === 'error').length,
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const base64Image = result.assets[0].base64;
        if (base64Image) {
          const imageUrl = `data:image/jpeg;base64,${base64Image}`;
          setForm({ ...form, image_url: imageUrl });
        }
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const base64Image = result.assets[0].base64;
        if (base64Image) {
          const imageUrl = `data:image/jpeg;base64,${base64Image}`;
          setForm({ ...form, image_url: imageUrl });
        }
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSave = async () => {
    Alert.alert('Success', 'Item saved! (Database write would happen here)');
    setShowAddDialog(false);
    setForm({ name: '', sku: '', price_crc: '0', current_weight_grams: '0', min_threshold_grams: '100', category_id: '', image_url: '', description: '' });
  };

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
      <View style={styles.header}>
        <Text style={styles.title}>Inventory</Text>
        <Button mode="text" onPress={() => setShowAddDialog(true)}>Add Item</Button>
      </View>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}><Card.Content><Text style={styles.statValue}>{stats.total}</Text><Text style={styles.statLabel}>Total</Text></Card.Content></Card>
        <Card style={styles.statCard}><Card.Content><Text style={[styles.statValue, { color: COLORS.warning }]}>{stats.low}</Text><Text style={styles.statLabel}>Low</Text></Card.Content></Card>
        <Card style={styles.statCard}><Card.Content><Text style={[styles.statValue, { color: COLORS.error }]}>{stats.out}</Text><Text style={styles.statLabel}>Out</Text></Card.Content></Card>
      </View>

      <View style={styles.filters}>
        <Searchbar placeholder="Search..." value={search} onChangeText={setSearch} style={styles.searchbar} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          <Chip selected={!selectedCategory} onPress={() => setSelectedCategory('')} style={styles.chip}>All</Chip>
          {categories.map(cat => (
            <Chip key={cat.id} selected={selectedCategory === cat.id} onPress={() => setSelectedCategory(cat.id)} style={styles.chip}>{cat.name}</Chip>
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Chip selected={stockFilter === 'all'} onPress={() => setStockFilter('all')} style={styles.chip}>All</Chip>
          <Chip selected={stockFilter === 'success'} onPress={() => setStockFilter('success')} style={styles.chip}>Stock</Chip>
          <Chip selected={stockFilter === 'warning'} onPress={() => setStockFilter('warning')} style={styles.chip}>Low</Chip>
          <Chip selected={stockFilter === 'error'} onPress={() => setStockFilter('error')} style={styles.chip}>Out</Chip>
        </ScrollView>
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const status = getStockStatus(item);
          return (
            <Card style={styles.itemCard}>
              <Card.Content style={styles.itemContent}>
                <View style={styles.itemImageContainer}>
                  {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={styles.itemImage} />
                  ) : (
                    <View style={styles.itemImagePlaceholder}><Text>📷</Text></View>
                  )}
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemSku}>{item.sku}</Text>
                </View>
                <View style={styles.itemStock}>
                  <Text>{item.current_weight_grams}g</Text>
                </View>
                <View style={styles.itemPrice}>
                  <Text style={styles.priceValue}>₡{item.price_crc?.toLocaleString()}</Text>
                </View>
              </Card.Content>
            </Card>
          );
        }}
      />

      <FAB icon="plus" style={styles.fab} onPress={() => setShowAddDialog(true)} />

      {showAddDialog && (
        <View style={styles.dialogOverlay}>
          <ScrollView style={styles.dialog}>
            <Text style={styles.dialogTitle}>Add New Item</Text>
            
            <View style={styles.imageSection}>
              {form.image_url ? (
                <Image source={{ uri: form.image_url }} style={styles.previewImage} />
              ) : (
                <View style={styles.imagePlaceholder}><Text style={{fontSize:40}}>📷</Text></View>
              )}
              <View style={styles.imageButtons}>
                <Button mode="outlined" onPress={takePhoto}>📷 Camera</Button>
                <Button mode="outlined" onPress={pickImage}>🖼️ Gallery</Button>
              </View>
            </View>

            <Text style={styles.inputLabel}>Name</Text>
            <TextInput style={styles.textInput} value={form.name} onChangeText={t => setForm({...form, name: t})} placeholder="Item name" />
            
            <Text style={styles.inputLabel}>SKU</Text>
            <TextInput style={styles.textInput} value={form.sku} onChangeText={t => setForm({...form, sku: t})} placeholder="SKU-001" />
            
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Price (CRC)</Text>
                <TextInput style={styles.textInput} value={form.price_crc} onChangeText={t => setForm({...form, price_crc: t})} keyboardType="numeric" />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Weight (g)</Text>
                <TextInput style={styles.textInput} value={form.current_weight_grams} onChangeText={t => setForm({...form, current_weight_grams: t})} keyboardType="numeric" />
              </View>
            </View>

            <View style={styles.dialogButtons}>
              <Button onPress={() => setShowAddDialog(false)}>Cancel</Button>
              <Button mode="contained" onPress={handleSave}>Save</Button>
            </View>
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 24, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', padding: 10, gap: 10, backgroundColor: 'white' },
  statCard: { flex: 1 },
  statValue: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 12, color: '#666' },
  filters: { padding: 10, backgroundColor: 'white' },
  searchbar: { backgroundColor: '#f5f5f5', marginBottom: 10 },
  categoryScroll: { marginBottom: 5 },
  chip: { marginRight: 8 },
  list: { padding: 10 },
  itemCard: { marginBottom: 10, backgroundColor: 'white' },
  itemContent: { flexDirection: 'row', alignItems: 'center' },
  itemImageContainer: { marginRight: 15 },
  itemImage: { width: 50, height: 50, borderRadius: 8 },
  itemImagePlaceholder: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600' },
  itemSku: { fontSize: 11, color: '#999' },
  itemStock: { marginRight: 15 },
  itemPrice: { alignItems: 'flex-end' },
  priceValue: { fontSize: 14, fontWeight: 'bold' },
  fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor: COLORS.primary },
  dialogOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', padding: 20, paddingTop: 50 },
  dialog: { backgroundColor: 'white', borderRadius: 16, padding: 20, maxHeight: '90%' },
  dialogTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  imageSection: { alignItems: 'center', marginBottom: 15 },
  previewImage: { width: 100, height: 100, borderRadius: 50, marginBottom: 10 },
  imagePlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  imageButtons: { flexDirection: 'row', gap: 10 },
  inputLabel: { fontSize: 14, fontWeight: '600', marginTop: 10, marginBottom: 5 },
  textInput: { backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8, marginBottom: 5, fontSize: 16 },
  row: { flexDirection: 'row', gap: 10 },
  halfInput: { flex: 1 },
  dialogButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 15 },
});