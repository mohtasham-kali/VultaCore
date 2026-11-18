// server-internal.ts — service-role Supabase client. Never use on the client.
// Bypasses RLS intentionally. Only call after you've verified the user's identity
// via the cookie-based client (src/utils/supabase/server.ts).
import { createServerClient } from "@supabase/ssr";

export async function createClient() {
  // No cookies: attaching a user session would let RLS fire, defeating the
  // purpose of the service role. Only use on the server, after auth checks.
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } },
  );
}

