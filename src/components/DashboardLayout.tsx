'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Box, Card, CardContent, Typography, Button, IconButton, Select, MenuItem, 
  FormControl, InputLabel, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Chip, Grid, LinearProgress, Drawer, List, ListItem, ListItemIcon, ListItemText, Divider, AppBar, Toolbar
} from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  ShoppingCart,
  Inventory,
  People,
  Settings,
  Receipt,
  Menu as MenuIcon,
  Refresh, 
  Logout,
  Assessment,
  Devices
} from '@mui/icons-material';
import { supabase } from '@/lib/supabase';
import { Sale, Item, User, Category as CategoryType } from '@/types';
import { formatCurrency, formatDate, getStockStatus, getStockStatusLabel } from '@/utils/format';

const COLORS = { 
  primary: '#6B4C9A', 
  secondary: '#D4AF37', 
  accent: '#20B2AA', 
  success: '#228B22', 
  warning: '#FFA500', 
  error: '#DC3545',
  drawerWidth: 240
};

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { id: 'sales', label: 'Sales', icon: <ShoppingCart /> },
  { id: 'inventory', label: 'Inventory', icon: <Inventory /> },
  { id: 'users', label: 'Users', icon: <People /> },
  { id: 'reports', label: 'Reports', icon: <Assessment /> },
  { id: 'devices', label: 'Devices', icon: <Devices /> },
  { id: 'settings', label: 'Settings', icon: <Settings /> },
];

export default function DashboardLayout({ children, currentPage = 'dashboard' }: { children?: React.ReactNode, currentPage?: string }) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(true);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F7F5F3' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerOpen ? COLORS.drawerWidth : 72,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerOpen ? COLORS.drawerWidth : 72,
            boxSizing: 'border-box',
            bgcolor: COLORS.primary,
            color: 'white',
            transition: 'width 0.2s',
            overflowX: 'hidden',
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {drawerOpen && <Typography variant="h6" fontWeight="bold">CrystalPOS</Typography>}
          <IconButton onClick={() => setDrawerOpen(!drawerOpen)} sx={{ color: 'white' }}>
            <MenuIcon />
          </IconButton>
        </Box>
        
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
        
        <List>
          {navItems.map((item) => (
            <ListItem
              key={item.id}
              component={Link}
              href={item.id === 'dashboard' ? '/' : `/${item.id}`}
              sx={{
                bgcolor: currentPage === item.id ? 'rgba(255,255,255,0.15)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                cursor: 'pointer',
                borderRadius: 1,
                mx: 1,
                my: 0.5,
              }}
            >
              <ListItemIcon sx={{ color: 'white', minWidth: drawerOpen ? 40 : 'auto' }}>
                {item.icon}
              </ListItemIcon>
              {drawerOpen && <ListItemText primary={item.label} />}
            </ListItem>
          ))}
        </List>
        
        <Box sx={{ mt: 'auto', p: 2 }}>
          {drawerOpen && (
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              v1.0.0
            </Typography>
          )}
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flex: 1, p: 0, overflow: 'auto' }}>
        {children}
      </Box>
    </Box>
  );
}