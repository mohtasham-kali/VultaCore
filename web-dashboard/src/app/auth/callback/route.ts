import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      console.error('Server auth code exchange error:', error);
    } catch (err) {
      console.error('Failed to create server Supabase client in callback route:', err);
    }
  }

  // Fallback to client callback page if server exchange failed or not applicable
  return NextResponse.redirect(`${origin}/auth/callback?${searchParams.toString()}`);
}
