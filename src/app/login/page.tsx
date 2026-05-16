'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Paper, Typography, TextField, Button, Alert, CircularProgress } from '@mui/material';
import { useAuth } from '@/lib/auth';
import { COLORS } from '@/lib/constants';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn(email, password);
    if (result.error) {
      setError(result.error.message);
      setLoading(false);
    } else {
      router.push('/');
    }
  }

  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#F7F5F3', p: 2 }}>
      <Paper sx={{ p: 4, maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <Typography variant="h4" fontWeight="bold" sx={{ color: COLORS.primary, mb: 1 }}>
          <Box component="span" sx={{ color: '#D4AF37' }}>Mark</Box>
          <Box component="span" sx={{ color: '#2E7D32' }}>et</Box>
          <Box component="span" sx={{ color: '#D4AF37' }}>POS</Box>
        </Typography>
        <Typography variant="h6" sx={{ mb: 3, color: COLORS.lightText }}>Systems Manager Login</Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <TextField fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required sx={{ mb: 2 }} />
          <TextField fullWidth label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required sx={{ mb: 3 }} />
          <Button type="submit" variant="contained" fullWidth size="large" disabled={loading} sx={{ bgcolor: COLORS.primary, py: 1.5 }}>
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
          </Button>
        </form>

        <Typography variant="body2" sx={{ mt: 3, color: COLORS.lightText }}>
          Restricted access. Contact administrator if you need credentials.
        </Typography>
      </Paper>
    </Box>
  );
}