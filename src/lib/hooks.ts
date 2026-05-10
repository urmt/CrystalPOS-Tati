'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchDashboardStats } from '@/lib/dashboard';
import { Sale, Item, User } from '@/types';

export function useDashboardData(initialPeriod: string = 'today') {
  const [sales, setSales] = useState<Sale[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState(initialPeriod);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchDashboardStats(period);
      setSales(data.sales);
      setItems(data.items);
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch dashboard data'));
      console.error('Dashboard Data Fetch Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    sales,
    items,
    users,
    isLoading,
    period,
    setPeriod,
    refresh: loadData,
    error
  };
}
