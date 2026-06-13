import { supabase } from '@/lib/supabase';
import { Sale, Item, User, Category, Subcategory, SubSubcategory, Customer, Todo } from '@/types';

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

  async fetchSubSubcategories(activeOnly = true) {
    let query = supabase.from('sub_subcategories').select('*').order('name');
    if (activeOnly) query = query.eq('is_active', true);
    const { data, error } = await query;
    if (error) throw error;
    return data as SubSubcategory[];
  },

  async createSubSubcategory(subSubcategory: Partial<SubSubcategory>) {
    const { data, error } = await supabase.from('sub_subcategories').insert(subSubcategory).select().single();
    if (error) throw error;
    return data as SubSubcategory;
  },

  async deleteSubSubcategory(id: string) {
    const { error } = await supabase.from('sub_subcategories').delete().eq('id', id);
    if (error) throw error;
  },

  async createSale(sale: Partial<Sale>) {
    const { data, error } = await supabase.from('sales').insert(sale).select().single();
    if (error) throw error;
    return data as Sale;
  },
};

export function calculateSalesByCategory(sales: Sale[], items: Item[], categories: Category[]) {
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

export function calculateSalesBySubcategory(sales: Sale[], items: Item[], subcategories: Subcategory[], categories: Category[]) {
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

export function calculateSalesByMineralType(sales: Sale[], items: Item[], subcategories: Subcategory[], categories: Category[]) {
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

export function calculateSalesBySubSubcategory(
  sales: Sale[], items: Item[], subSubcategories: SubSubcategory[], subcategories: Subcategory[], categories: Category[]
) {
  const catMap: Record<string, string> = {};
  const subMap: Record<string, string> = {};
  categories.forEach(c => { catMap[c.id] = c.name; });
  subcategories.forEach(s => { subMap[s.id] = s.name; });

  const ssMap: Record<string, {
    name: string; subcategoryName: string; categoryName: string;
    qty: number; revenue: number; unitCount: number;
  }> = {};

  subSubcategories.forEach(ss => {
    ssMap[ss.id] = {
      name: ss.name,
      subcategoryName: subMap[ss.subcategory_id] || 'Unknown',
      categoryName: 'Unknown',
      qty: 0, revenue: 0, unitCount: 0,
    };
    const parentSub = subcategories.find(s => s.id === ss.subcategory_id);
    if (parentSub) {
      ssMap[ss.id].categoryName = catMap[parentSub.category_id] || 'Unknown';
    }
  });

  sales.forEach(sale => {
    (sale.items_sold || []).forEach(sold => {
      const item = items.find(i => i.id === sold.item_id);
      if (item?.sub_subcategory_id && ssMap[item.sub_subcategory_id]) {
        ssMap[item.sub_subcategory_id].qty += sold.qty_grams || 0;
        ssMap[item.sub_subcategory_id].revenue += sold.price || 0;
        ssMap[item.sub_subcategory_id].unitCount += 1;
      }
    });
  });

  return Object.values(ssMap).filter(s => s.qty > 0 || s.unitCount > 0).sort((a, b) => b.revenue - a.revenue);
}

export function calculateSalesByMineralTypeCrossCategory(
  sales: Sale[], items: Item[], subcategories: Subcategory[]
) {
  const mineralAgg: Record<string, { name: string; qty: number; revenue: number; unitCount: number }> = {};

  subcategories.forEach(s => {
    if (!mineralAgg[s.name]) {
      mineralAgg[s.name] = { name: s.name, qty: 0, revenue: 0, unitCount: 0 };
    }
  });

  sales.forEach(sale => {
    (sale.items_sold || []).forEach(sold => {
      const item = items.find(i => i.id === sold.item_id);
      if (item?.subcategory_id) {
        const sub = subcategories.find(s => s.id === item.subcategory_id);
        if (sub && mineralAgg[sub.name]) {
          mineralAgg[sub.name].qty += sold.qty_grams || 0;
          mineralAgg[sub.name].revenue += sold.price || 0;
          mineralAgg[sub.name].unitCount += 1;
        }
      }
    });
  });

  const totalRevenue = Object.values(mineralAgg).reduce((sum, m) => sum + m.revenue, 0);

  return Object.values(mineralAgg)
    .filter(m => m.qty > 0 || m.unitCount > 0)
    .map(m => ({
      ...m,
      percentage: totalRevenue > 0 ? ((m.revenue / totalRevenue) * 100).toFixed(1) : '0',
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

export function calculateSalesBySizeCrossCategory(
  sales: Sale[], items: Item[], subSubcategories: SubSubcategory[]
) {
  const sizeAgg: Record<string, { name: string; qty: number; revenue: number; unitCount: number }> = {};

  subSubcategories.forEach(ss => {
    if (!sizeAgg[ss.name]) {
      sizeAgg[ss.name] = { name: ss.name, qty: 0, revenue: 0, unitCount: 0 };
    }
  });

  sales.forEach(sale => {
    (sale.items_sold || []).forEach(sold => {
      const item = items.find(i => i.id === sold.item_id);
      if (item?.sub_subcategory_id) {
        const ss = subSubcategories.find(s => s.id === item.sub_subcategory_id);
        if (ss && sizeAgg[ss.name]) {
          sizeAgg[ss.name].qty += sold.qty_grams || 0;
          sizeAgg[ss.name].revenue += sold.price || 0;
          sizeAgg[ss.name].unitCount += 1;
        }
      }
    });
  });

  const totalRevenue = Object.values(sizeAgg).reduce((sum, s) => sum + s.revenue, 0);

  return Object.values(sizeAgg)
    .filter(s => s.qty > 0 || s.unitCount > 0)
    .map(s => ({
      ...s,
      percentage: totalRevenue > 0 ? ((s.revenue / totalRevenue) * 100).toFixed(1) : '0',
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

export function calculateChessBoardSales(sales: Sale[], items: Item[], categories: Category[]) {
  const chessCat = categories.find(c => c.name === 'Tournament Smart Chess Board');
  if (!chessCat) return { totalBoards: 0, totalRevenue: 0, crystalTypes: [] as { name: string; count: number }[] };

  let totalBoards = 0;
  let totalRevenue = 0;
  const typeCounts: Record<string, number> = {};

  sales.forEach(sale => {
    (sale.items_sold || []).forEach(sold => {
      const item = items.find(i => i.id === sold.item_id);
      if (item?.category_id === chessCat.id) {
        totalBoards += 1;
        totalRevenue += sold.price || 0;
        if (sold.chess_crystal_types) {
          sold.chess_crystal_types.forEach(t => {
            typeCounts[t] = (typeCounts[t] || 0) + 1;
          });
        }
      }
    });
  });

  const crystalTypes = Object.entries(typeCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return { totalBoards, totalRevenue, crystalTypes };
}