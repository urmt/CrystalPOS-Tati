'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, TextField, List, Chip, Dialog, DialogTitle, 
  DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { Refresh, CheckCircle, Cancel, Image as ImageIcon } from '@mui/icons-material';
import { supabase } from '@/lib/supabase';
import { Todo } from '@/types';
import DashboardLayout from '@/components/DashboardLayout';

const FOLDERS = ['All', 'Pending', 'In Progress', 'Done', 'Archive'];
const DEFAULT_FOLDER = 'Pending';

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newTodo, setNewTodo] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('All');
  const [newTodoImage, setNewTodoImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('todos').select('*').order('created_at', { ascending: false });
    if (data) setTodos(data as Todo[]);
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSaveTodo = async () => {
    if (!newTodo.trim()) return;
    await supabase.from('todos').insert({
      request_text: newTodo,
      created_by: 'admin',
      status: 'pending',
      folder: DEFAULT_FOLDER,
      image_url: newTodoImage
    });
    setShowAdd(false);
    setNewTodo('');
    setNewTodoImage(null);
    fetchData();
  };

  const handleImageSelect = () => fileInputRef.current?.click();
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setNewTodoImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleStatusChange = async (todo: Todo, newStatus: string) => {
    const folder = newStatus === 'done' ? 'Done' : newStatus === 'in_progress' ? 'In Progress' : 'Pending';
    await supabase.from('todos').update({ 
      status: newStatus,
      folder,
      completed_at: newStatus === 'done' ? new Date().toISOString() : null
    }).eq('id', todo.id);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this TODO?')) return;
    await supabase.from('todos').delete().eq('id', id);
    fetchData();
  };

  const filteredTodos = selectedFolder === 'All' 
    ? todos 
    : todos.filter(t => t.folder === selectedFolder);

  const actions = (
    <Button variant="contained" onClick={() => setShowAdd(true)}>Add TODO</Button>
  );

  return (
    <DashboardLayout currentPage="todos" title="TODOs" actions={actions}>
      <Box sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Folder</InputLabel>
          <Select 
            value={selectedFolder} 
            label="Folder" 
            onChange={(e) => setSelectedFolder(e.target.value)}
          >
            {FOLDERS.map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Request</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Folder</TableCell>
              <TableCell>Image</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTodos.map(todo => (
              <TableRow key={todo.id}>
                <TableCell>{new Date(todo.created_at).toLocaleDateString()}</TableCell>
                <TableCell>{todo.request_text}</TableCell>
                <TableCell>
                  <Chip 
                    label={todo.status} 
                    size="small" 
                    color={todo.status === 'done' ? 'success' : todo.status === 'in_progress' ? 'warning' : 'default'} 
                  />
                </TableCell>
                <TableCell>{todo.folder}</TableCell>
                <TableCell>
                  {todo.image_url && (
                    <Box sx={{ width: 40, height: 40, borderRadius: 1, overflow: 'hidden' }}>
                      <img src={todo.image_url} alt="Todo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </Box>
                  )}
                </TableCell>
                <TableCell align="right">
                  {todo.status !== 'done' && (
                    <Button size="small" color="success" onClick={() => handleStatusChange(todo, 'done')}>
                      <CheckCircle />
                    </Button>
                  )}
                  {todo.status !== 'in_progress' && todo.status !== 'done' && (
                    <Button size="small" color="warning" onClick={() => handleStatusChange(todo, 'in_progress')}>
                      In Progress
                    </Button>
                  )}
                  <Button size="small" color="error" onClick={() => handleDelete(todo.id)}>
                    <Cancel />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={showAdd} onClose={() => { setShowAdd(false); setNewTodoImage(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>Add TODO for Tati</DialogTitle>
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
    </DashboardLayout>
  );
}