import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase Environment Variables in Middleware!");
    return supabaseResponse;
  }

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

  // Simplified redirect logic: Only redirect if definitely not logged in and trying to access protected paths
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
  const isHomePage = request.nextUrl.pathname === '/';
  const isStaticAsset = request.nextUrl.pathname.includes('.');

  // DEBUG: Add a header to see if the server detected a user
  supabaseResponse.headers.set('X-Vultacore-User', user ? 'detected' : 'none');
  supabaseResponse.headers.set('X-Vultacore-Debug', isAuthPage ? 'auth-page' : 'protected-page');

  /*
  // Temporary disable redirect to see if session works at all
  if (!user && !isAuthPage && !isHomePage && !isStaticAsset) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    return NextResponse.redirect(url)
  }
  */

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
