import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../src/utils/supabaseClient.js';
import crypto from 'crypto';

// Basic CORS headers helper
function setCorsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Password hashing helper using standard Node.js pbkdf2
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, originalHash] = stored.split(':');
    if (!salt || !originalHash) return false;
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === originalHash;
  } catch (err) {
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Ensure server-side environment is secure and uses the service role key to bypass RLS safely
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) {
    console.warn(
      "SECURITY WARNING: SUPABASE_SERVICE_ROLE_KEY is not defined in the backend environment. " +
      "Without the service role key, the backend is running under standard client/anon privileges. " +
      "If 'site_users' has Row-Level Security (RLS) enabled without public select/insert policies, " +
      "auth actions will fail. Please add SUPABASE_SERVICE_ROLE_KEY to your backend environment variables."
    );
  }

  const { action, site_id, email, password } = req.body;

  if (!site_id || !email || !password) {
    return res.status(400).json({ error: "Missing required fields. site_id, email, and password are required." });
  }

  // Trim and lowercase email for consistency
  const normalizedEmail = email.trim().toLowerCase();

  try {
    if (action === 'signup') {
      // 1. Check if user already exists for this site_id
      const { data: existingUser, error: checkError } = await supabase
        .from('site_users')
        .select('id')
        .eq('site_id', site_id)
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (checkError) {
        // Handle table missing or other errors gracefully
        if (checkError.message?.includes('does not exist') || checkError.code === '42P01') {
          return res.status(400).json({ 
            error: "The 'site_users' table does not exist in your Supabase project. Please execute the SQL migration script inside your Supabase SQL editor to enable the Auth Starter Kit." 
          });
        }
        throw checkError;
      }

      if (existingUser) {
        return res.status(400).json({ error: "An account with this email already exists on this site." });
      }

      // 2. Hash password and insert user
      const password_hash = hashPassword(password);
      const { data: newUser, error: insertError } = await supabase
        .from('site_users')
        .insert({
          site_id,
          email: normalizedEmail,
          password_hash,
        })
        .select('id, email, site_id, created_at')
        .single();

      if (insertError) {
        throw insertError;
      }

      return res.status(200).json({ 
        success: true, 
        message: "Account created successfully!",
        user: newUser 
      });

    } else if (action === 'login') {
      // 1. Fetch user by site_id and email
      const { data: user, error: fetchError } = await supabase
        .from('site_users')
        .select('id, email, password_hash, created_at')
        .eq('site_id', site_id)
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (fetchError) {
        if (fetchError.message?.includes('does not exist') || fetchError.code === '42P01') {
          return res.status(400).json({ 
            error: "The 'site_users' table does not exist in your Supabase project. Please execute the SQL migration script." 
          });
        }
        throw fetchError;
      }

      if (!user) {
        return res.status(400).json({ error: "Invalid email or password." });
      }

      // 2. Verify password
      const isPasswordValid = verifyPassword(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(400).json({ error: "Invalid email or password." });
      }

      // 3. Generate a mock session token
      const token = crypto.randomBytes(32).toString('hex');

      return res.status(200).json({
        success: true,
        message: "Logged in successfully!",
        user: {
          id: user.id,
          email: user.email,
          site_id,
          created_at: user.created_at
        },
        token
      });

    } else {
      return res.status(400).json({ error: "Invalid action. Supported actions are 'signup' and 'login'." });
    }
  } catch (err: any) {
    console.error("Auth helper error:", err);
    return res.status(500).json({ error: "Internal server error: " + (err.message || String(err)) });
  }
}
