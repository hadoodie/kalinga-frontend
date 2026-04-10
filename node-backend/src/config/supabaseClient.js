import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    '[supabaseClient] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set — Supabase features will be unavailable.'
  );
}

// Admin client with service role key — bypasses RLS; use only server-side
const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: { schema: 'public' },
    })
  : null;

// Public client with anon key — respects RLS
const supabase = (supabaseUrl && (supabaseAnonKey || supabaseServiceKey))
  ? createClient(supabaseUrl, supabaseAnonKey || supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: { schema: 'public' },
    })
  : null;

export { supabase, supabaseAdmin };
export default supabaseAdmin;
