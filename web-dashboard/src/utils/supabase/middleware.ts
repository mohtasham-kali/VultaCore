import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const DEFAULT_SUPABASE_URL = 'https://izimqwjupqzcogrtyuik.supabase.co';
  const DEFAULT_SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6aW1xd2p1cHF6Y29ncnR5dWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDAzMDYsImV4cCI6MjA5MTQxNjMwNn0.iYPKYStQvwtMYSERgjhomgwFuVQVnFHt1ksn0E-vhQY';

  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const envKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabaseUrl = envUrl && !envUrl.includes('placeholder') ? envUrl : DEFAULT_SUPABASE_URL;
  const supabaseKey = envKey && !envKey.includes('placeholder') ? envKey : DEFAULT_SUPABASE_ANON_KEY;

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
  const isAdminPage = request.nextUrl.pathname.startsWith('/admin');

  // Enforce server-side route protection for admin panel
  if (isAdminPage) {
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/auth';
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    const adminEmail = (process.env.ADMIN_EMAIL || 'mohtasham.siddiqui17@gmail.com').toLowerCase().trim();
    if ((user.email || '').toLowerCase().trim() !== adminEmail) {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = '/';
      return NextResponse.redirect(homeUrl);
    }
  }

  // Only emit debug headers in development environment
  if (process.env.NODE_ENV === 'development') {
    supabaseResponse.headers.set('X-Vultacore-User', user ? 'detected' : 'none');
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're creating a new
  // response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing the cookies!
  // 4. Finally: return myNewResponse
  // If this is not done, you may be causing the browser and server to go out of sync and terminate the user's session prematurelly.

  return supabaseResponse
}
