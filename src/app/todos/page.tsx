'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Paper, TextField, InputAdornment, List, ListItem, ListItemText, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { Search, Download, Refresh, Dashboard as DashboardIcon, ShoppingCart, Inventory, Settings, Assessment, CheckCircle, Cancel, People, Devices, Image as ImageIcon } from '@mui/icons-material';
import { supabase } from '@/lib/supabase';
import { Todo } from '@/types';
import { formatCurrency } from '@/utils/format';

const COLORS = { primary: '#6B4C9A', secondary: '#D4AF37', warning: '#FF9800', success: '#228B22' };

const FOLDERS = ['All', 'Pending', 'In Progress', 'Done', 'Archive'];
const DEFAULT_FOLDER = 'Pending';

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newTodo, setNewTodo] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('All');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('todos').select('*').order('created_at', { ascending: false });
    if (data) setTodos(data as Todo[]);
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filteredTodos = selectedFolder === 'All' ? todos : todos.filter(t => (t.folder || 'Pending') === selectedFolder);
  const pendingCount = todos.filter(t => (t.folder || 'Pending') === 'Pending').length;
  const doneCount = todos.filter(t => (t.folder || 'Pending') === 'Done').length;

  const handleImageSelect = () => { fileInputRef.current?.click(); };
  
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setNewTodoImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const [newTodoImage, setNewTodoImage] = useState<string | null>(null);

  const handleSaveTodo = async () => {
    if (!newTodo.trim()) {
      alert('Please enter a note');
      return;
    }
    try {
      const { error } = await supabase.from('todos').insert({ 
        request_text: newTodo, 
        created_by: 'admin', 
        status: 'pending',
        folder: 'Pending',
        image_url: newTodoImage
      });
      if (error) {
        console.error('Insert error:', error);
        alert('Error saving: ' + error.message);
        return;
      }
      setNewTodo('');
      setNewTodoImage(null);
      setShowAdd(false);
      fetchData();
    } catch (err) {
      console.error('Save error:', err);
      alert('Error saving note');
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Paper sx={{ width: 220, p: 2, borderRadius: 0 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: COLORS.primary, mb: 4 }}>
          💎 <Box component="span" sx={{ color: '#D4AF37' }}>Mark</Box><Box component="span" sx={{ color: '#2E7D32' }}>et</Box><Box component="span" sx={{ color: '#D4AF37' }}>POS</Box>
        </Typography>
        <List>
          {['Dashboard', 'Sales', 'Inventory', 'Reports', 'TODOs', 'Customers', 'Users', 'Devices', 'Settings'].map((label, i) => (
            <ListItem key={label} component="a" href={['/', '/sales', '/inventory', '/reports', '/todos', '/customers', '/users', '/devices', '/settings'][i]} sx={{ borderRadius: 1, mb: 0.5, bgcolor: label === 'TODOs' ? COLORS.primary : 'transparent', color: label === 'TODOs' ? 'white' : '#333' }}>
              <ListItemText primary={label} />
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

        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
          {FOLDERS.filter(f => f !== 'All').map(folder => (
            <Chip key={folder} label={folder} onClick={() => setSelectedFolder(folder)} color={selectedFolder === folder ? 'primary' : 'default'} />
          ))}
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
                <TableCell sx={{ color: 'white' }}>Image</TableCell>
                <TableCell sx={{ color: 'white' }}>Request</TableCell>
                <TableCell sx={{ color: 'white' }}>Folder</TableCell>
                <TableCell sx={{ color: 'white' }}>Date</TableCell>
                <TableCell sx={{ color: 'white' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} align="center">Loading...</TableCell></TableRow>
              ) : filteredTodos.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center">No TODOs yet</TableCell></TableRow>
              ) : filteredTodos.map(todo => (
                <TableRow key={todo.id} sx={{ opacity: (todo.folder || 'Pending') === 'Done' ? 0.6 : 1 }}>
                  <TableCell>
                    {todo.image_url ? (
                      <Box sx={{ width: 50, height: 50, borderRadius: 1, overflow: 'hidden' }}>
                        <img src={todo.image_url} alt="Note" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </Box>
                    ) : (
                      <Box sx={{ width: 50, height: 50, bgcolor: 'grey.200', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ImageIcon sx={{ color: 'grey.400' }} />
                      </Box>
                    )}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200 }}>{todo.request_text}</TableCell>
                  <TableCell>
                    <Chip label={todo.folder || 'Pending'} size="small" color={(todo.folder || 'Pending') === 'Done' ? 'success' : 'warning'} />
                  </TableCell>
                  <TableCell>{new Date(todo.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Select size="small" value={todo.folder || 'Pending'} onChange={async (e) => {
                      await supabase.from('todos').update({ folder: e.target.value }).eq('id', todo.id);
                      fetchData();
                    }} sx={{ minWidth: 100 }}>
                      {FOLDERS.filter(f => f !== 'All').map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
                    </Select>
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
      <Dialog open={showAdd} onClose={() => { setShowAdd(false); setNewTodoImage(null); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: COLORS.primary, color: 'white' }}>Add TODO for Tati</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField fullWidth multiline rows={3} label="Request / Note" value={newTodo} onChange={(e) => setNewTodo(e.target.value)} sx={{ mb: 2 }} />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Folder</InputLabel>
            <Select defaultValue="Pending" label="Folder">
              {FOLDERS.filter(f => f !== 'All').map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button variant="outlined" startIcon={<ImageIcon />} onClick={handleImageSelect}>Add Photo</Button>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} hidden />
            {newTodoImage && (
              <Box sx={{ width: 60, height: 60, borderRadius: 1, overflow: 'hidden' }}>
                <img src={newTodoImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setShowAdd(false); setNewTodoImage(null); }}>Cancel</Button>
          <Button variant="contained" disabled={!newTodo.trim()} onClick={handleSaveTodo}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}