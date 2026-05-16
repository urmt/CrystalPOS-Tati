'use client';

import { useState, useEffect } from 'react';
import { Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Add } from '@mui/icons-material';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';
import DashboardLayout from '@/components/DashboardLayout';

type UserRole = 'admin' | 'vendor_manager';

interface UserForm {
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>({ email: '', full_name: '', role: 'vendor_manager', is_active: true });

  function fetchData() {
    setIsLoading(true);
    supabase.from('users').select('*').order('email').then(({ data }) => {
      if (data) setUsers(data as User[]);
      setIsLoading(false);
    });
  }

  useEffect(() => { fetchData(); }, []);

  function openAddDialog() {
    setEditUser(null);
    setForm({ email: '', full_name: '', role: 'vendor_manager', is_active: true });
    setDialogOpen(true);
  }

  function openEditDialog(user: User) {
    setEditUser(user);
    setForm({ email: user.email, full_name: user.full_name || '', role: user.role as UserRole, is_active: user.is_active });
    setDialogOpen(true);
  }

  function handleSave() {
    if (editUser) {
      supabase.from('users').update(form).eq('id', editUser.id).then(() => {
        setDialogOpen(false);
        fetchData();
      });
    } else {
      supabase.from('users').insert({ ...form, id: crypto.randomUUID(), created_at: new Date().toISOString() }).then(() => {
        setDialogOpen(false);
        fetchData();
      });
    }
  }

  function handleToggle(user: User) {
    supabase.from('users').update({ is_active: !user.is_active }).eq('id', user.id).then(() => fetchData());
  }

  function handleDelete(user: User) {
    if (confirm(`Delete ${user.email}?`)) {
      supabase.from('users').delete().eq('id', user.id).then(() => fetchData());
    }
  }

  return (
    <DashboardLayout currentPage="users" title="Users" actions={<Button variant="contained" startIcon={<Add />} onClick={openAddDialog}>Add User</Button>}>
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
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map(user => (
              <TableRow key={user.id}>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.full_name || '-'}</TableCell>
                <TableCell><Chip label={user.role} size="small" /></TableCell>
                <TableCell><Chip label={user.is_active ? 'Active' : 'Inactive'} size="small" color={user.is_active ? 'success' : 'default'} /></TableCell>
                <TableCell>{user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}</TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => openEditDialog(user)}>Edit</Button>
                  <Button size="small" color={user.is_active ? 'error' : 'success'} onClick={() => handleToggle(user)}>{user.is_active ? 'Disable' : 'Enable'}</Button>
                  <Button size="small" color="error" onClick={() => handleDelete(user)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>{editUser ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} sx={{ mb: 2, mt: 1 }} />
          <TextField fullWidth label="Full Name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} sx={{ mb: 2 }} />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Role</InputLabel>
            <Select value={form.role} label="Role" onChange={e => setForm({ ...form, role: e.target.value as UserRole })}>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="vendor_manager">Vendor Manager</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Active</InputLabel>
            <Select value={form.is_active ? 'true' : 'false'} label="Active" onChange={e => setForm({ ...form, is_active: e.target.value === 'true' })}>
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Inactive</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}