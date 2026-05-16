import { ReactNode } from 'react';
import {
  Dashboard as DashboardIcon,
  ShoppingCart,
  Inventory,
  Assessment,
  CheckCircle,
  People,
  Devices,
  Settings
} from '@mui/icons-material';

export const COLORS = {
  primary: '#6B4C9A',
  primaryDark: '#4a3570',
  secondary: '#D4AF37',
  accent: '#20B2AA',
  success: '#228B22',
  error: '#DC3545',
  warning: '#FFA500',
  darkText: '#1a1a1a',
  lightText: '#333333',
  drawerWidth: 240,
};

export interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
  href: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, href: '/' },
  { id: 'sales', label: 'Sales', icon: <ShoppingCart />, href: '/sales' },
  { id: 'inventory', label: 'Inventory', icon: <Inventory />, href: '/inventory' },
  { id: 'reports', label: 'Reports', icon: <Assessment />, href: '/reports' },
  { id: 'todos', label: 'TODOs', icon: <CheckCircle />, href: '/todos' },
  { id: 'customers', label: 'Customers', icon: <People />, href: '/customers' },
  { id: 'users', label: 'Users', icon: <People />, href: '/users' },
  { id: 'devices', label: 'Devices', icon: <Devices />, href: '/devices' },
  { id: 'settings', label: 'Settings', icon: <Settings />, href: '/settings' },
];

export const PERIOD_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
];

export const PAYMENT_METHODS = [
  { value: 'sinpe', label: 'SINPE' },
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'lightning', label: 'Lightning' },
];