import { createClient } from '@supabase/supabase-js';

// Default to placeholder values if keys are not set, for local UI testing.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://izimqwjupqzcogrtyuik.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6aW1xd2p1cHF6Y29ncnR5dWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDAzMDYsImV4cCI6MjA5MTQxNjMwNn0.iYPKYStQvwtMYSERgjhomgwFuVQVnFHt1ksn0E-vhQY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
