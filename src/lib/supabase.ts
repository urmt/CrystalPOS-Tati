// =============================================================================
// SUPABASE CLIENT
// Version: 1.1
// Date: April 15, 2026
// Description: Supabase client setup for MarketPOS admin portal
// =============================================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check .env.local');
}

// Regular client for all operations (uses anon key)
// RLS policies in Supabase give admin permissions to authenticated users
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storage: typeof window !== 'undefined' ? localStorage : undefined,
  },
});

// Alias for backward compatibility
export const supabaseAdmin = supabase;