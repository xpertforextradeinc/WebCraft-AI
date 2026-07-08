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
export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseUrl.startsWith('http') && 
  !supabaseUrl.includes('placeholder') &&
  activeKey && 
  !activeKey.includes('placeholder')
);

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

// Fallback to a valid-formatted placeholder URL and key to prevent createClient from throwing a fatal runtime error at module load time.
const safeSupabaseUrl = isSupabaseConfigured ? supabaseUrl : 'https://placeholder-please-configure-env.supabase.co';

// Use a syntactically valid mock JWT token structure for fallback key to prevent browsers (like Safari/Webkit)
// from throwing "DOMException: The string did not match the expected pattern" when decoding base64 payload.
const safeActiveKey = isSupabaseConfigured ? activeKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIn0.cGxhY2Vob2xkZXI';

export const supabase = createClient(safeSupabaseUrl, safeActiveKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
