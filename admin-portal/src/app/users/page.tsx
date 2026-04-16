'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Paper, Chip, LinearProgress, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, FormControl, InputLabel, Select, Switch, MenuItem,
  Drawer, List, ListItem, ListItemIcon, ListItemText, Divider, IconButton
} from '@mui/material';
import { People, Add, Edit, Delete, Menu as MenuIcon } from '@mui/icons-material';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';

const COLORS = { primary: '#6B4C9A', drawerWidth: 240 };
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: <People />, href: '/' },
  { id: 'sales', label: 'Sales', icon: <People />, href: '/sales' },
  { id: 'inventory', label: 'Inventory', icon: <People />, href: '/inventory' },
  { id: 'users', label: 'Users', icon: <People />, href: '/users' },
  { id: 'settings', label: 'Settings', icon: <People />, href: '/settings' },
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState({ email: '', full_name: '', role: 'vendor_manager' as const, is_active: true });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase.from('users').select('*').order('email');
      if (data) setUsers(data as User[]);
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    try {
      if (editUser) {
        await supabase.from('users').update(form).eq('id', editUser.id);
      } else {
        await supabase.from('users').insert({ ...form, id: crypto.randomUUID(), created_at: new Date().toISOString() });
      }
      setDialogOpen(false);
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleToggle = async (user: User) => {
    await supabase.from('users').update({ is_active: !user.is_active }).eq('id', user.id);
    fetchData();
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Delete ${user.email}?`)) return;
    await supabase.from('users').delete().eq('id', user.id);
    fetchData();
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F7F5F3' }}>
      <Drawer variant="permanent" sx={{ width: drawerOpen ? COLORS.drawerWidth : 72, '& .MuiDrawer-paper': { width: drawerOpen ? COLORS.drawerWidth : 72, bgcolor: COLORS.primary, color: 'white' } }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {drawerOpen && <Typography variant="h6" fontWeight="bold">CrystalPOS</Typography>}
          <IconButton onClick={() => setDrawerOpen(!drawerOpen)} sx={{ color: 'white' }}><MenuIcon /></IconButton>
        </Box>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
        <List>{navItems.map(item => <ListItem key={item.id} component="a" href={item.href} sx={{ bgcolor: item.href === '/users' ? 'rgba(255,255,255,0.15)' : 'transparent', cursor: 'pointer', borderRadius: 1, mx: 1 }}><ListItemIcon sx={{ color: 'white', minWidth: drawerOpen ? 40 : 'auto' }}>{item.icon}</ListItemIcon>{drawerOpen && <ListItemText primary={item.label} />}</ListItem>)}</List>
      </Drawer>

      <Box component="main" sx={{ flex: 1, p: 3, overflow: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ color: COLORS.primary }}>User Management</Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => { setEditUser(null); setForm({ email: '', full_name: '', role: 'vendor_manager', is_active: true }); setDialogOpen(true); }}>
            Add User
          </Button>
        </Box>

        {isLoading && <LinearProgress />}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Login</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.full_name || '-'}</TableCell>
                  <TableCell><Chip label={user.role === 'admin' ? 'Admin' : 'Vendor'} size="small" color={user.role === 'admin' ? 'primary' : 'default'} /></TableCell>
                  <TableCell><Chip label={user.is_active ? 'Active' : 'Inactive'} size="small" color={user.is_active ? 'success' : 'error'} /></TableCell>
                  <TableCell>{user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}</TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => { setEditUser(user); setForm({ email: user.email, full_name: user.full_name || '', role: user.role, is_active: user.is_active }); setDialogOpen(true); }}>Edit</Button>
                    <Switch size="small" checked={user.is_active} onChange={() => handleToggle(user)} />
                    <Button size="small" color="error" onClick={() => handleDelete(user)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editUser ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} sx={{ mt: 2 }} disabled={!!editUser} />
          <TextField fullWidth label="Full Name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} sx={{ mt: 2 }} />
          <FormControl fullWidth sx={{ mt: 2 }}><InputLabel>Role</InputLabel>
            <Select value={form.role} label="Role" onChange={e => setForm({ ...form, role: e.target.value as 'admin' | 'vendor_manager' })}>
              <MenuItem value="vendor_manager">Vendor Manager</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}