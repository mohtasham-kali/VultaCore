"use server";

import { ApiError } from "@paddle/paddle-node-sdk";
import { getPaddleInstance } from "@/utils/paddle/get-paddle-instance";
import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@/utils/supabase/server-internal";
import { queryDb } from "@/utils/db/postgres";

/**
 * Mints a Paddle Customer Portal session URL for the currently authenticated user.
 *
 * Security model:
 * 1. Auth is checked first — anonymous calls are rejected before any DB or SDK call.
 * 2. The Paddle customer_id is resolved server-side from the auth session via the
 *    customers table or subscriptions table. The client never supplies a customer ID.
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

  // 2. Resolve the user's Paddle customer_id server-side from session / DB.
  let customerId: string | null = null;

  try {
    const admin = await createAdminClient();
    const { data: customerRow } = await admin
      .from("customers")
      .select("customer_id")
      .eq("email", user.email)
      .maybeSingle();

    if (customerRow?.customer_id) {
      customerId = customerRow.customer_id;
    } else {
      const { data: subRow } = await admin
        .from("subscriptions")
        .select("customer_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (subRow?.customer_id) {
        customerId = subRow.customer_id;
      }
    }
  } catch {
    // If Supabase client fails, fall through to direct DB query below
  }

  if (!customerId) {
    try {
      const rows = await queryDb<{ customer_id: string }>(
        `SELECT customer_id FROM customers WHERE email = $1 LIMIT 1;`,
        [user.email],
      );
      if (rows && rows.length > 0) {
        customerId = rows[0].customer_id;
      } else {
        const subRows = await queryDb<{ customer_id: string }>(
          `SELECT customer_id FROM subscriptions WHERE user_id = $1 LIMIT 1;`,
          [user.id],
        );
        if (subRows && subRows.length > 0) {
          customerId = subRows[0].customer_id;
        }
      }
    } catch (pgErr) {
      console.warn("[portal] queryDb error:", pgErr);
    }
  }

  if (!customerId) {
    // User exists in auth but hasn't completed a checkout yet — no Paddle record.
    return { error: "No Paddle customer record found. Please subscribe first." };
  }

  // 3. Mint the portal session. customerId comes exclusively from the DB,
  //    never from client input — preventing IDOR attacks.
  try {
    const paddle = getPaddleInstance();
    const session = await paddle.customerPortalSessions.create(
      customerId,
      [],
    );

    // Return only the overview URL
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
    console.error("[portal] Unexpected error:", error);
    return {
      error: "Couldn't open the billing portal. Please try again.",
    };
  }
}
