import Link from 'next/link';
import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, Typography, Divider, IconButton } from '@mui/material';
import { Menu as MenuIcon, Dashboard as DashboardIcon, ShoppingCart, Inventory, Assessment, CheckCircle, People, Devices, Settings } from '@mui/icons-material';

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

interface AdminSidebarProps {
  currentPage: string;
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function AdminSidebar({ currentPage, collapsed = false, onToggle }: AdminSidebarProps) {
  const drawerWidth = collapsed ? 72 : 240;
  const COLORS = { primary: '#6B4C9A', drawerWidth: 240 };

  return (
    <Drawer 
      variant="permanent" 
      sx={{ 
        width: drawerWidth, 
        '& .MuiDrawer-paper': { 
          width: drawerWidth, 
          bgcolor: COLORS.primary, 
          color: 'white',
          border: 'none'
        } 
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'white' }}>
        {collapsed ? null : (
          <Typography variant="h6" fontWeight="bold">
            <Box component="span" sx={{ color: '#D4AF37' }}>Mark</Box>
            <Box component="span" sx={{ color: '#2E7D32' }}>et</Box>
            <Box component="span" sx={{ color: '#D4AF37' }}>POS</Box>
          </Typography>
        )}
        <IconButton onClick={onToggle} sx={{ color: 'white' }}>
          <MenuIcon />
        </IconButton>
      </Box>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
      <List>
        {navItems.map(item => {
          const isActive = currentPage === '' 
            ? item.href === '/' 
            : item.href.replace('/', '') === currentPage;
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
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            >
              <ListItemIcon sx={{ color: 'white', minWidth: collapsed ? 'auto' : 40 }}>
                {item.icon}
              </ListItemIcon>
              {!collapsed && <ListItemText primary={item.label} />}
            </ListItem>
          );
        })}
      </List>
    </Drawer>
  );
}