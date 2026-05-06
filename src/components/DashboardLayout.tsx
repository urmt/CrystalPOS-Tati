// =============================================================================
// DASHBOARD LAYOUT COMPONENT
// Common sidebar layout for admin pages
// =============================================================================

'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, Typography, Divider } from '@mui/material';
import { Dashboard as DashboardIcon, ShoppingCart, Inventory, Assessment, CheckCircle, People, Devices, Settings } from '@mui/icons-material';

interface DashboardLayoutProps {
  children: ReactNode;
  currentPage?: string;
}

const navItems = [
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

export default function DashboardLayout({ children, currentPage = '' }: DashboardLayoutProps) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F7F5F3' }}>
      <Drawer variant="permanent" sx={{ width: 240, '& .MuiDrawer-paper': { width: 240, bgcolor: '#6B4C9A', color: 'white' } }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'white' }}>
          <Typography variant="h6" fontWeight="bold"><Box component="span" sx={{ color: '#D4AF37' }}>Mark</Box><Box component="span" sx={{ color: '#2E7D32' }}>et</Box><Box component="span" sx={{ color: '#D4AF37' }}>POS</Box></Typography>
        </Box>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
        <List>
          {navItems.map((item) => {
            const isActive = currentPage === '' ? item.href === '/' : item.href.replace('/', '') === currentPage;
            return (
              <ListItem 
                key={item.id} 
                component={Link} 
                href={item.href}
                sx={{ 
                  bgcolor: isActive ? 'rgba(255,255,255,0.15)' : 'transparent', 
                  cursor: 'pointer', 
                  borderRadius: 1, 
                  mx: 1,
                  my: 0.5,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                }}
              >
                <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItem>
            );
          })}
        </List>
      </Drawer>
      <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
        {children}
      </Box>
    </Box>
  );
}