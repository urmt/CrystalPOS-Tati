// =============================================================================
// SUPABASE CONFIG FOR EXPO
// =============================================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://savdtmzhgtpddqtreoty.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_DNxLnc4RNlLwpx5y8KmUdQ_tYUSxKTS';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);