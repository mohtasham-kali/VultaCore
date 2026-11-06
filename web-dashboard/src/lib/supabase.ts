import { createClient } from '@supabase/supabase-js';

// VultaCore Public Client Credentials (safe for browser distribution)
const DEFAULT_SUPABASE_URL = 'https://izimqwjupqzcogrtyuik.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6aW1xd2p1cHF6Y29ncnR5dWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDAzMDYsImV4cCI6MjA5MTQxNjMwNn0.iYPKYStQvwtMYSERgjhomgwFuVQVnFHt1ksn0E-vhQY';

const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const envKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Use environment variable if valid; fallback to production project defaults if placeholder/unset
const supabaseUrl =
  envUrl && !envUrl.includes('placeholder') ? envUrl : DEFAULT_SUPABASE_URL;

const supabaseAnonKey =
  envKey && !envKey.includes('placeholder') ? envKey : DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
