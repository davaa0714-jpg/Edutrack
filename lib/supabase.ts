import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

const parsedUrl = new URL(supabaseUrl);
if (!parsedUrl.hostname.endsWith('.supabase.co')) {
  throw new Error(`Invalid NEXT_PUBLIC_SUPABASE_URL hostname: ${parsedUrl.hostname}`);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
