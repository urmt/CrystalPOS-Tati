import { supabase } from '@/lib/supabase';
import { Sale, Item, User, Category, Subcategory, Customer, Todo } from '@/types';

export const api = {
  async fetchSales(dateFrom?: string, dateTo?: string, limit = 500) {
    let query = supabase.from('sales').select('*').order('sale_date', { ascending: false }).limit(limit);
    if (dateFrom) query = query.gte('sale_date', dateFrom);
    if (dateTo) query = query.lte('sale_date', dateTo + 'T23:59:59');
    const { data, error } = await query;
    if (error) throw error;
    return data as Sale[];
  },

  async fetchItems(filters?: { isActive?: boolean; categoryId?: string; search?: string }) {
    let query = supabase.from('items').select('*').order('name');
    if (filters?.isActive) query = query.eq('is_active', true);
    if (filters?.categoryId) query = query.eq('category_id', filters.categoryId);
    const { data, error } = await query;
    if (error) throw error;
    let items = data as Item[];
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(i => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q));
    }
    return items;
  },

  async fetchCategories(activeOnly = true) {
    let query = supabase.from('categories').select('*').order('display_order');
    if (activeOnly) query = query.eq('is_active', true);
    const { data, error } = await query;
    if (error) throw error;
    return data as Category[];
  },

  async fetchSubcategories(activeOnly = true) {
    let query = supabase.from('subcategories').select('*').order('name');
    if (activeOnly) query = query.eq('is_active', true);
    const { data, error } = await query;
    if (error) throw error;
    return data as Subcategory[];
  },

  async fetchUsers() {
    const { data, error } = await supabase.from('users').select('*').order('email');
    if (error) throw error;
    return data as User[];
  },

  async fetchCustomers() {
    const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data as Customer[];
  },

  async fetchTodos() {
    const { data, error } = await supabase.from('todos').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data as Todo[];
  },

  async createItem(item: Partial<Item>) {
    const { data, error } = await supabase.from('items').insert(item).select().single();
    if (error) throw error;
    return data as Item;
  },

  async updateItem(id: string, updates: Partial<Item>) {
    const { data, error } = await supabase.from('items').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as Item;
  },

  async createCategory(category: Partial<Category>) {
    const { data, error } = await supabase.from('categories').insert(category).select().single();
    if (error) throw error;
    return data as Category;
  },

  async createSubcategory(subcategory: Partial<Subcategory>) {
    const { data, error } = await supabase.from('subcategories').insert(subcategory).select().single();
    if (error) throw error;
    return data as Subcategory;
  },

  async createSale(sale: Partial<Sale>) {
    const { data, error } = await supabase.from('sales').insert(sale).select().single();
    if (error) throw error;
    return data as Sale;
  },
};

export async function calculateSalesByCategory(sales: Sale[], items: Item[], categories: Category[]) {
  const catMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  
  categories.forEach(c => { catMap[c.id] = { name: c.name, qty: 0, revenue: 0 }; });
  
  sales.forEach(sale => {
    (sale.items_sold || []).forEach(sold => {
      const item = items.find(i => i.id === sold.item_id);
      if (item?.category_id && catMap[item.category_id]) {
        catMap[item.category_id].qty += sold.qty_grams || 0;
        catMap[item.category_id].revenue += sold.price || 0;
      }
    });
  });
  
  return Object.values(catMap).filter(c => c.qty > 0).sort((a, b) => b.revenue - a.revenue);
}

export async function calculateSalesBySubcategory(sales: Sale[], items: Item[], subcategories: Subcategory[], categories: Category[]) {
  const subMap: Record<string, { name: string; categoryId: string; categoryName: string; qty: number; revenue: number }> = {};
  const catMap: Record<string, string> = {};
  categories.forEach(c => { catMap[c.id] = c.name; });
  
  subcategories.forEach(s => { 
    subMap[s.id] = { name: s.name, categoryId: s.category_id, categoryName: catMap[s.category_id] || 'Unknown', qty: 0, revenue: 0 }; 
  });
  
  sales.forEach(sale => {
    (sale.items_sold || []).forEach(sold => {
      const item = items.find(i => i.id === sold.item_id);
      if (item?.subcategory_id && subMap[item.subcategory_id]) {
        subMap[item.subcategory_id].qty += sold.qty_grams || 0;
        subMap[item.subcategory_id].revenue += sold.price || 0;
      }
    });
  });
  
  return Object.values(subMap).filter(s => s.qty > 0).sort((a, b) => b.revenue - a.revenue);
}

export async function calculateSalesByMineralType(sales: Sale[], items: Item[], subcategories: Subcategory[], categories: Category[]) {
  const mineralMap: Record<string, { name: string; mineralType: string; qty: number; revenue: number; categories: Set<string> }> = {};
  const catMap: Record<string, string> = {};
  categories.forEach(c => { catMap[c.id] = c.name; });
  
  subcategories.forEach(s => {
    mineralMap[s.id] = { 
      name: s.name, 
      mineralType: s.name,
      qty: 0, 
      revenue: 0,
      categories: new Set() 
    };
  });
  
  sales.forEach(sale => {
    (sale.items_sold || []).forEach(sold => {
      const item = items.find(i => i.id === sold.item_id);
      if (item?.subcategory_id && mineralMap[item.subcategory_id]) {
        mineralMap[item.subcategory_id].qty += sold.qty_grams || 0;
        mineralMap[item.subcategory_id].revenue += sold.price || 0;
        if (item.category_id) {
          mineralMap[item.subcategory_id].categories.add(catMap[item.category_id] || 'Unknown');
        }
      }
    });
  });
  
  return Object.values(mineralMap)
    .filter(m => m.qty > 0)
    .map(m => ({ ...m, categories: Array.from(m.categories).join(', ') }))
    .sort((a, b) => b.revenue - a.revenue);
}