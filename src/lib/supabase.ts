// =============================================================================
// SUPABASE CLIENT
// Version: 1.0
// Date: April 15, 2026
// Description: Supabase client setup for CrystalPOS admin portal
// =============================================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://savdtmzhgtpddqtreoty.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_DNxLnc4RNlLwpx5y8KmUdQ_tYUSxKTS';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_Kww8rNm-UgAH2uNB7IDbRg_nCiLMEHJ';

// Regular client for reading (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storage: typeof window !== 'undefined' ? localStorage : undefined,
  },
});

// Admin client for writes (uses service role key)
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});