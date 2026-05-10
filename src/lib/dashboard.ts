import { Sale, Item, User } from '@/types';
import { supabase } from '@/lib/supabase';

// =============================================================================
// getPeriodDates: Helper to get start and end date strings for a given period
// =============================================================================
export const getPeriodDates = (period: string) => {
  const now = new Date();
  let start: Date;
  const end = now;

  switch (period) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'yesterday':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      yesterdayEnd.setHours(23, 59, 59, 999);
      return { 
        startStr: start.toISOString().split('T')[0], 
        endStr: yesterdayEnd.toISOString().split('T')[0] 
      };
    case 'week':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      break;
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  return {
    startStr: start.toISOString().split('T')[0],
    endStr: end.toISOString().split('T')[0]
  };
};

// =============================================================================
// fetchDashboardStats: Core data fetching logic for the dashboard
// =============================================================================
export const fetchDashboardStats = async (period: string) => {
  const { startStr, endStr } = getPeriodDates(period);

  const [salesRes, itemsRes, usersRes] = await Promise.all([
    supabase.from('sales')
      .select('*')
      .gte('sale_date', startStr + 'T00:00:00')
      .lte('sale_date', endStr + 'T23:59:59')
      .order('sale_date', { ascending: false }),
    supabase.from('items').select('*').order('name'),
    supabase.from('users').select('*').order('email'),
  ]);

  if (salesRes.error) throw salesRes.error;
  if (itemsRes.error) throw itemsRes.error;
  if (usersRes.error) throw usersRes.error;

  return {
    sales: (salesRes.data || []) as Sale[],
    items: (itemsRes.data || []) as Item[],
    users: (usersRes.data || []) as User[]
  };
};
