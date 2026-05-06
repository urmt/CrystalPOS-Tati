// =============================================================================
// DASHBOARD LAYOUT COMPONENT
// Common sidebar layout for admin pages
// =============================================================================

'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { Box, Drawer, List, ListItem, ListItemText, Typography, Divider } from '@mui/material';
import { Dashboard as DashboardIcon, ShoppingCart, Inventory, Assessment, CheckCircle, People, Devices, Settings } from '@mui/icons-material';

interface DashboardLayoutProps {
  children: ReactNode;
  currentPage?: string;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, href: '/' },
  { id: 'sales', label: 'Ventas', icon: <ShoppingCart />, href: '/sales' },
  { id: 'inventory', label: 'Inventario', icon: <Inventory />, href: '/inventory' },
  { id: 'reports', label: 'Reportes', icon: <Assessment />, href: '/reports' },
  { id: 'todos', label: 'Notas', icon: <CheckCircle />, href: '/todos' },
  { id: 'customers', label: 'Clientes', icon: <People />, href: '/customers' },
  { id: 'users', label: 'Usuarios', icon: <People />, href: '/users' },
  { id: 'devices', label: 'Dispositivos', icon: <Devices />, href: '/devices' },
  { id: 'settings', label: 'Ajustes', icon: <Settings />, href: '/settings' },
];

export default function DashboardLayout({ children, currentPage = '' }: DashboardLayoutProps) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F7F5F3' }}>
      <Drawer variant="permanent" sx={{ width: 240, '& .MuiDrawer-paper': { width: 240, bgcolor: '#6B4C9A', color: 'white' } }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight="bold">CrystalPOS</Typography>
        </Box>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
        <List>
          {navItems.map((item) => (
            <ListItem 
              key={item.id} 
              component={Link} 
              href={item.href}
              sx={{ 
                bgcolor: item.href === `/${currentPage}` || (currentPage === '' && item.href === '/') ? 'rgba(255,255,255,0.15)' : 'transparent', 
                cursor: 'pointer', 
                borderRadius: 1, 
                mx: 1,
                my: 0.5,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            >
              <ListItemText primary={item.label} />
            </ListItem>
          ))}
        </List>
      </Drawer>
      <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
        {children}
      </Box>
    </Box>
  );
}