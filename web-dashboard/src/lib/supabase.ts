import { createClient } from '@supabase/supabase-js';

// Retrieve Supabase configuration from environment variables
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  (process.env.NODE_ENV === 'production' ? '' : 'https://placeholder.supabase.co');

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  (process.env.NODE_ENV === 'production' ? '' : 'placeholder-anon-key');

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    console.error('Supabase client initialized without required environment variables.');
  }
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder-anon-key');
