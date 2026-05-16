// =============================================================================
// DASHBOARD LAYOUT COMPONENT
// Common sidebar layout for admin pages
// =============================================================================

'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Box, Drawer, List, ListItem, ListItemIcon, ListItemText, 
  Typography, Divider, IconButton, Button, CircularProgress 
} from '@mui/material';
import { 
  Menu as MenuIcon, Logout
} from '@mui/icons-material';
import { COLORS, NAV_ITEMS } from '@/lib/constants';
import { useAuth } from '@/lib/auth';

interface DashboardLayoutProps {
  children: ReactNode;
  currentPage?: string;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function DashboardLayout({ 
  children, 
  currentPage = '', 
  title,
  subtitle,
  actions 
}: DashboardLayoutProps) {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F7F5F3' }}>
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
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'white' }}>
          {drawerOpen && (
            <Typography variant="h6" fontWeight="bold">
              <Box component="span" sx={{ color: '#D4AF37' }}>Mark</Box>
              <Box component="span" sx={{ color: '#2E7D32' }}>et</Box>
              <Box component="span" sx={{ color: '#D4AF37' }}>POS</Box>
            </Typography>
          )}
          <IconButton onClick={() => setDrawerOpen(!drawerOpen)} sx={{ color: 'white' }}>
            <MenuIcon />
          </IconButton>
        </Box>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
        <List>
          {NAV_ITEMS.map((item) => {
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
                  my: 0.5,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                }}
              >
                <ListItemIcon sx={{ color: 'white', minWidth: drawerOpen ? 40 : 'auto' }}>
                  {item.icon}
                </ListItemIcon>
                {drawerOpen && <ListItemText primary={item.label} />}
              </ListItem>
            );
          })}
        </List>
      </Drawer>
      
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3, 
          bgcolor: 'white', 
          p: 2, 
          borderRadius: 2 
        }}>
          <Box>
            {title && (
              <Typography variant="h4" fontWeight="bold" sx={{ color: COLORS.primary }}>
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {actions}
            <Button 
              variant="outlined" 
              color="error" 
              onClick={handleLogout} 
              startIcon={<Logout />}
              size="small"
            >
              Logout
            </Button>
          </Box>
        </Box>
        
        {/* Content */}
        <Box sx={{ p: 3, pt: 0 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}