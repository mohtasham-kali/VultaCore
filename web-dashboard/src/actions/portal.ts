"use server";

import { ApiError } from "@paddle/paddle-node-sdk";
import { getPaddleInstance } from "@/utils/paddle/get-paddle-instance";
import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@/utils/supabase/server-internal";

/**
 * Mints a Paddle Customer Portal session URL for the currently authenticated user.
 *
 * Security model:
 * 1. Auth is checked first — anonymous calls are rejected before any DB or SDK call.
 * 2. The Paddle customer_id is resolved server-side from the auth session via the
 *    customers table (synced by webhooks). The client never supplies a customer ID.
 * 3. Only the portal URL is returned — not the full session object, which would
 *    leak customer_id, session ID, and deep-link data the client doesn't need.
 *
 * Returns { url } on success, { error } on failure.
 */
export async function createPortalSession(): Promise<
  { url: string } | { error: string }
> {
  // 1. Authenticate — reject unauthenticated requests immediately.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { error: "Not authenticated" };
  }

  // 2. Resolve the user's Paddle customer_id from the mirrored customers table.
  //    Use the service-role client to bypass RLS — we've already verified identity above.
  const admin = await createAdminClient();
  const { data: customerRow } = await admin
    .from("customers")
    .select("customer_id")
    .eq("email", user.email)
    .single();

  if (!customerRow?.customer_id) {
    // User exists in auth but hasn't completed a checkout yet — no Paddle record.
    return { error: "No Paddle customer record found. Please subscribe first." };
  }

  // 3. Mint the portal session. customerId comes from the DB row (step 2),
  //    never from client input — this prevents IDOR attacks.
  //    Passing [] means the session is for the overview page, not a specific subscription.
  //    If you want a "cancel this subscription" deep link, pass [subscriptionId] and
  //    use session.urls.subscriptions[0].cancelSubscription instead.
  try {
    const paddle = getPaddleInstance();
    const session = await paddle.customerPortalSessions.create(
      customerRow.customer_id,
      [],
    );

    // Return only the overview URL — nothing else from the session object.
    return { url: session.urls.general.overview };
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(
        "[portal] Paddle API error:",
        error.code,
        error.detail,
      );
      return {
        error: "Couldn't open the billing portal. Please try again.",
      };
    }
    throw error;
  }
}

