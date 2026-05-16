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
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchDashboardStats(period);
      setSales(data.sales);
      setItems(data.items);
      setUsers(data.users);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
      setError(message);
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

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}