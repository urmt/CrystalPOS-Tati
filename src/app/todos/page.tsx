'use client';

import { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Paper, TextField, InputAdornment, List, ListItem, ListItemText, Chip, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Search, Download, Refresh, Dashboard as DashboardIcon, ShoppingCart, Inventory, Settings, Assessment, CheckCircle, Cancel } from '@mui/icons-material';
import { supabase } from '@/lib/supabase';
import { Todo } from '@/types';

const COLORS = { primary: '#6B4C9A', secondary: '#D4AF37', warning: '#FF9800', success: '#228B22' };

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newTodo, setNewTodo] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('todos').select('*').order('created_at', { ascending: false });
    if (data) setTodos(data as Todo[]);
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const pendingCount = todos.filter(t => t.status === 'pending').length;
  const doneCount = todos.filter(t => t.status === 'done').length;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Paper sx={{ width: 220, p: 2, borderRadius: 0 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: COLORS.primary, mb: 4 }}>
          💎 CrystalPOS
        </Typography>
        <List>
          {[{ id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, href: '/' },
            { id: 'sales', label: 'Sales', icon: <ShoppingCart />, href: '/sales' },
            { id: 'inventory', label: 'Inventory', icon: <Inventory />, href: '/inventory' },
            { id: 'reports', label: 'Reports', icon: <Assessment />, href: '/reports' },
            { id: 'todos', label: 'TODOs', icon: <CheckCircle />, href: '/todos' },
            { id: 'customers', label: 'Customers', icon: <Search />, href: '/customers' },
            { id: 'settings', label: 'Settings', icon: <Settings />, href: '/settings' },
          ].map(item => (
            <ListItem key={item.id} component="a" href={item.href} sx={{ borderRadius: 1, mb: 0.5, bgcolor: item.id === 'todos' ? COLORS.primary : 'transparent', color: item.id === 'todos' ? 'white' : '#333', '&:hover': { bgcolor: item.id === 'todos' ? COLORS.primary : '#eee' } }}>
              <ListItemText primary={item.label} />
            </ListItem>
          ))}
        </List>
      </Paper>

      <Box sx={{ flex: 1, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: COLORS.primary }}>
            TODOs ({pendingCount} pending)
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button startIcon={<Refresh />} onClick={fetchData}>Refresh</Button>
            <Button variant="contained" startIcon={<CheckCircle />} onClick={() => setShowAdd(true)} sx={{ bgcolor: COLORS.primary }}>
              Add TODO
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: COLORS.warning }}>{pendingCount}</Typography>
            <Typography>Pending</Typography>
          </Paper>
          <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: COLORS.success }}>{doneCount}</Typography>
            <Typography>Done</Typography>
          </Paper>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ bgcolor: COLORS.primary }}>
              <TableRow>
                <TableCell sx={{ color: 'white' }}>Request</TableCell>
                <TableCell sx={{ color: 'white' }}>Created By</TableCell>
                <TableCell sx={{ color: 'white' }}>Date</TableCell>
                <TableCell sx={{ color: 'white' }}>Status</TableCell>
                <TableCell sx={{ color: 'white' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} align="center">Loading...</TableCell></TableRow>
              ) : todos.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center">No TODOs yet</TableCell></TableRow>
              ) : todos.map(todo => (
                <TableRow key={todo.id} sx={{ opacity: todo.status === 'done' ? 0.6 : 1 }}>
                  <TableCell>{todo.request_text}</TableCell>
                  <TableCell>
                    <Chip label={todo.created_by === 'admin' ? '📋 Admin' : '📝 Tati'} size="small" />
                  </TableCell>
                  <TableCell>{new Date(todo.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip label={todo.status === 'pending' ? 'Pending' : 'Done'} 
                      color={todo.status === 'pending' ? 'warning' : 'success'} size="small" />
                  </TableCell>
                  <TableCell>
                    {todo.status === 'pending' && (
                      <Button size="small" color="success" onClick={async () => {
                        await supabase.from('todos').update({ status: 'done', completed_at: new Date().toISOString() }).eq('id', todo.id);
                        fetchData();
                      }}>Mark Done</Button>
                    )}
                    <Button size="small" color="error" onClick={async () => {
                      await supabase.from('todos').delete().eq('id', todo.id);
                      fetchData();
                    }}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Add TODO Dialog */}
      <Dialog open={showAdd} onClose={() => setShowAdd(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: COLORS.primary, color: 'white' }}>Add TODO for Tati</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField fullWidth multiline rows={3} label="Request / Note" value={newTodo} onChange={(e) => setNewTodo(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShowAdd(false)}>Cancel</Button>
          <Button variant="contained" disabled={!newTodo.trim()} onClick={async () => {
            if (!newTodo.trim()) return;
            await supabase.from('todos').insert({ request_text: newTodo, created_by: 'admin', status: 'pending' });
            setNewTodo('');
            setShowAdd(false);
            fetchData();
          }}>Send to Tati</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}