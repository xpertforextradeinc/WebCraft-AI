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

// Fallback to a valid-formatted placeholder URL and key to prevent createClient from throwing a fatal runtime error at module load time.
const safeSupabaseUrl = supabaseUrl && supabaseUrl.startsWith('http') ? supabaseUrl : 'https://placeholder-please-configure-env.supabase.co';
const safeActiveKey = activeKey || 'placeholder-anon-key-please-configure-env';

export const supabase = createClient(safeSupabaseUrl, safeActiveKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
