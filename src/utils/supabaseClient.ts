import { createClient } from '@supabase/supabase-js';

// Resolve environment variables for both Vite (client-side) and Node (server-side)
const supabaseUrl = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && (process.env?.VITE_SUPABASE_URL || process.env?.NEXT_PUBLIC_SUPABASE_URL || process.env?.SUPABASE_URL));

const supabaseAnonKey = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && (process.env?.VITE_SUPABASE_ANON_KEY || process.env?.SUPABASE_ANON_KEY));

const supabaseServiceKey = 
  (typeof process !== 'undefined' && (process.env?.SUPABASE_SERVICE_ROLE_KEY || process.env?.SUPABASE_SERVICE_KEY));

// If we are on the server side and have a service role key, prioritize it to bypass RLS and foreign key limitations for backend operations
const activeKey = supabaseServiceKey || supabaseAnonKey;

if (!supabaseUrl || !activeKey) {
  console.warn(
    'Supabase environment variables are missing. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your settings / environment.'
  );
}

// Check if the variables are real or missing
const isSupabaseUrlValid = supabaseUrl && supabaseUrl.startsWith('http') && !supabaseUrl.includes('placeholder');
const isSupabaseKeyValid = activeKey && activeKey.length > 20;

export const isSupabaseConfigured = !!(isSupabaseUrlValid && isSupabaseKeyValid);

if (!isSupabaseConfigured) {
  console.error('Supabase not configured properly.');
  if (!isSupabaseUrlValid) console.error('  - VITE_SUPABASE_URL is missing or invalid.');
  if (!isSupabaseKeyValid) console.error('  - VITE_SUPABASE_ANON_KEY is missing or invalid.');
  console.info('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your Vercel project environment variables.');
}

export const getSupabaseProjectRef = () => {
  if (!supabaseUrl || !isSupabaseConfigured) return 'Sandbox Mode';
  try {
    const urlObj = new URL(supabaseUrl);
    const host = urlObj.hostname;
    if (host.includes('.supabase.co')) {
      return host.split('.')[0];
    }
    return host;
  } catch (e) {
    return 'Sandbox Mode';
  }
};

// Create a truly inert dummy client to avoid any SDK-internal JWT decoding errors
const dummySupabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } }, error: null }),
  },
  from: () => ({
    select: () => ({ data: [], error: 'Supabase not configured' }),
    insert: () => ({ data: null, error: 'Supabase not configured' }),
  }),
} as any;

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl!, activeKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : dummySupabase;
