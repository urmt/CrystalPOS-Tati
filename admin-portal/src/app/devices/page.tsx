// =============================================================================
// DEVICES PAGE - Device Management for iPad POS
// =============================================================================

'use client';

import { useState, useEffect } from 'react';
import { 
  Box, Typography, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Switch, IconButton, Chip, Alert,
  Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Refresh as RefreshIcon, Devices as DevicesIcon } from '@mui/icons-material';
import DashboardLayout from '@/components/DashboardLayout';
import { supabaseAdmin } from '@/lib/supabase';

interface Device {
  id: string;
  device_id: string;
  device_name: string;
  is_blocked: boolean;
  last_seen: string;
  created_at: string;
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDevice, setEditDevice] = useState<Device | null>(null);
  const [editName, setEditName] = useState('');

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabaseAdmin
        .from('device_registrations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setDevices(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const toggleBlock = async (device: Device) => {
    try {
      const { error } = await supabaseAdmin
        .from('device_registrations')
        .update({ is_blocked: !device.is_blocked })
        .eq('id', device.id);
      
      if (error) throw error;
      fetchDevices();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const updateName = async () => {
    if (!editDevice) return;
    try {
      const { error } = await supabaseAdmin
        .from('device_registrations')
        .update({ device_name: editName })
        .eq('id', editDevice.id);
      
      if (error) throw error;
      setEditDevice(null);
      fetchDevices();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const getStatusChip = (device: Device) => {
    if (device.is_blocked) {
      return <Chip label="Blocked" color="error" size="small" />;
    }
    const lastSeen = new Date(device.last_seen);
    const now = new Date();
    const diff = now.getTime() - lastSeen.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 5) {
      return <Chip label="Online" color="success" size="small" />;
    }
    return <Chip label="Offline" color="default" size="small" />;
  };

  return (
    <DashboardLayout title="Device Management">
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <DevicesIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h5">Registered iPad Devices</Typography>
          </Box>
          <Button 
            startIcon={<RefreshIcon />} 
            onClick={fetchDevices}
            variant="outlined"
          >
            Refresh
          </Button>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>How it works:</strong> iPad devices automatically register when they first access /pos. 
          You can block devices here to prevent unauthorized use. Blocked devices will see a 
          "Contact Systems Manager" message.
        </Alert>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Typography>Loading devices...</Typography>
        ) : devices.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <DevicesIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No devices registered yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              iPad devices will appear here when they first use the POS
            </Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell><strong>Device Name</strong></TableCell>
                  <TableCell><strong>Device ID</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Last Seen</strong></TableCell>
                  <TableCell><strong>Registered</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {devices.map((device) => (
                  <TableRow key={device.id} hover>
                    <TableCell>
                      <Typography fontWeight={device.is_blocked ? 'normal' : 'bold'}>
                        {device.device_name || 'Unnamed Device'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {device.device_id.substring(0, 12)}...
                      </Typography>
                    </TableCell>
                    <TableCell>{getStatusChip(device)}</TableCell>
                    <TableCell>{formatDate(device.last_seen)}</TableCell>
                    <TableCell>{formatDate(device.created_at)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button 
                          size="small" 
                          onClick={() => {
                            setEditDevice(device);
                            setEditName(device.device_name || '');
                          }}
                        >
                          Edit
                        </Button>
                        <Button 
                          size="small" 
                          color={device.is_blocked ? 'success' : 'error'}
                          onClick={() => toggleBlock(device)}
                        >
                          {device.is_blocked ? 'Unblock' : 'Block'}
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      <Dialog open={!!editDevice} onClose={() => setEditDevice(null)}>
        <DialogTitle>Edit Device Name</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Device Name"
            fullWidth
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="e.g., Tati's iPad, Market iPad #1"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDevice(null)}>Cancel</Button>
          <Button onClick={updateName} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}