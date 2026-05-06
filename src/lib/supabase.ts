// =============================================================================
// SUPABASE CLIENT
// Version: 1.1
// Date: April 15, 2026
// Description: Supabase client setup for MarketPOS admin portal
// =============================================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://savdtmzhgtpddqtreoty.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_DNxLnc4RNlLwpx5y8KmUdQ_tYUSxKTS';

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