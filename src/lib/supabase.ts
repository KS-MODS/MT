import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'sb_publishable_DB6avBtF2BKRsq1hVpBTZQ_ktxHUECH';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'https://mscbfdmulhukvvxysgty.supabase.co/rest/v1/';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Ensure .env.local is configured.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
//sb_publishable_DB6avBtF2BKRsq1hVpBTZQ_ktxHUECH
//https://mscbfdmulhukvvxysgty.supabase.co/rest/v1/


