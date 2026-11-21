import { type Customer, type Subscription } from "@paddle/paddle-node-sdk";
import { createClient as createAdminClient } from "@/utils/supabase/server-internal";
import { queryDb } from "@/utils/db/postgres";

export interface PaddleWebhookEvent<T = any> {
  eventId: string;
  eventType: string;
  occurredAt: string;
  notificationId?: string;
  data: T;
}

export interface PaddleSubscriptionData {
  id: string;
  customerId: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  items?: Array<{
    price?: {
      id?: string;
      productId?: string;
    };
    quantity?: number;
  }>;
  customData?: Record<string, any> | null;
  scheduledChange?: {
    action: string;
    effectiveAt: string;
  } | null;
}

export interface PaddleCustomerData {
  id: string;
  email: string;
  name?: string | null;
  customData?: Record<string, any> | null;
}

export interface PaddleTransactionData {
  id: string;
  customerId?: string | null;
  status: string;
  customer?: {
    id?: string;
    email?: string;
  } | null;
  customData?: Record<string, any> | null;
}

/**
 * Paddle delivers at-least-once and in no guaranteed order. The same
 * event.eventId arrives on every retry, so every handler below is
 * idempotent: UPSERT keyed on the Paddle resource id and guarded by
 * event.occurredAt.
 */
export async function processEvent(event: PaddleWebhookEvent) {
  switch (event.eventType) {
    case "subscription.created":
    case "subscription.updated":
    case "subscription.canceled":
    case "subscription.activated":
    case "subscription.past_due":
    case "subscription.paused":
    case "subscription.resumed":
      return saveSubscription(event.data, event.occurredAt);

    case "customer.created":
    case "customer.updated":
      return saveCustomer(event.data, event.occurredAt);

    case "transaction.completed":
      return handleTransactionCompleted(event);

    default:
      // Subscribed to other events? Safely ignore (no-op).
      return;
  }
}

/**
 * Saves or updates a subscription idempotently using atomic upsert_subscription.
 * Guarded by last_event_at so out-of-order deliveries never overwrite newer state.
 */
export async function saveSubscription(
  sub: PaddleSubscriptionData | Subscription,
  eventAt: string,
) {
  let userId =
    (sub.customData?.userId as string | undefined) ||
    (sub.customData?.user_id as string | undefined) ||
    null;

  // If userId is missing from customData, resolve it from customers email -> auth.users id
  if (!userId && sub.customerId) {
    try {
      const rows = await queryDb<{ id: string }>(
        `SELECT u.id FROM auth.users u
         JOIN customers c ON c.email = u.email
         WHERE c.customer_id = $1
         LIMIT 1;`,
        [sub.customerId],
      );
      if (rows[0]?.id) {
        userId = rows[0].id;
      }
    } catch (e) {
      console.warn("[saveSubscription] could not resolve user by customerId:", e);
    }
  }

  const priceItem = sub.items?.[0]?.price;
  const priceId = priceItem?.id ?? "";
  const productId = priceItem?.productId ?? "";
  const scheduledChangeAction = sub.scheduledChange?.action ?? null;
  const scheduledChangeEffectiveAt = sub.scheduledChange?.effectiveAt ?? null;

  let rpcSuccess = false;
  try {
    const admin = await createAdminClient();
    const { error } = await admin.rpc("upsert_subscription", {
      p_subscription_id: sub.id,
      p_customer_id: sub.customerId,
      p_user_id: typeof userId === "string" ? userId : null,
      p_status: sub.status,
      p_price_id: priceId,
      p_product_id: productId,
      p_scheduled_change_action: scheduledChangeAction,
      p_scheduled_change_effective_at: scheduledChangeEffectiveAt,
      p_paddle_created_at: sub.createdAt,
      p_last_event_at: eventAt,
    });
    if (!error) {
      rpcSuccess = true;
    }
  } catch (rpcErr) {
    console.warn("[saveSubscription] RPC attempt notice:", rpcErr);
  }

  if (!rpcSuccess) {
    // Direct PostgreSQL execution via connection pool
    await queryDb(
      `SELECT upsert_subscription($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);`,
      [
        sub.id,
        sub.customerId,
        typeof userId === "string" ? userId : null,
        sub.status,
        priceId,
        productId,
        scheduledChangeAction,
        scheduledChangeEffectiveAt,
        sub.createdAt,
        eventAt,
      ],
    );
  }

  // Also sync user rank if user_id is present
  if (userId) {
    try {
      const planName =
        (sub.customData?.planName as string) ||
        (sub.customData?.plan_name as string);
      let rankToSet = planName;
      if (!rankToSet) {
        if (
          priceId.includes("01m7r41epjb34524nsn3nebdym") ||
          priceId.includes("01m7r41eyvfc4x09tr8dv3nmtm")
        ) {
          rankToSet = "Enterprise";
        } else if (
          priceId.includes("01m7r41dwfzw108seb2ptyvzrh") ||
          priceId.includes("01m7r41e4p5a3w63m65b6ewd05") ||
          priceId.includes("01m7r12e4rwbrt25331y3sm88p")
        ) {
          rankToSet = "Premium";
        } else if (
          priceId.includes("01m7r41d01n8xa18z8kzwhchv1") ||
          priceId.includes("01m7r41d7yphdthpr9jhkw3b00") ||
          priceId.includes("01m7r11zk5c3bma7a6k0y70g5n")
        ) {
          rankToSet = "Standard";
        }
      }
      if (sub.status === "canceled") {
        rankToSet = "Free";
      }
      if (rankToSet) {
        try {
          const admin = await createAdminClient();
          await admin.from("user").update({ rank: rankToSet }).eq("id", userId);
          await admin.from("profiles").update({ plan: rankToSet.toLowerCase() }).eq("id", userId);
        } catch {
          await queryDb(`UPDATE "user" SET rank = $1 WHERE id = $2;`, [
            rankToSet,
            userId,
          ]);
          await queryDb(`UPDATE profiles SET plan = $1 WHERE id = $2;`, [
            rankToSet.toLowerCase(),
            userId,
          ]);
        }
      }
    } catch (syncErr) {
      console.warn("[saveSubscription] user rank sync error (non-fatal):", syncErr);
    }
  }
}

/**
 * Saves or updates a customer idempotently using atomic upsert_customer.
 */
export async function saveCustomer(
  customer: PaddleCustomerData | Customer,
  eventAt: string,
) {
  let rpcSuccess = false;
  try {
    const admin = await createAdminClient();
    const { error } = await admin.rpc("upsert_customer", {
      p_customer_id: customer.id,
      p_email: customer.email,
      p_last_event_at: eventAt,
    });
    if (!error) {
      rpcSuccess = true;
    }
  } catch (rpcErr) {
    console.warn("[saveCustomer] RPC attempt notice:", rpcErr);
  }

  if (!rpcSuccess) {
    // Direct PostgreSQL execution via connection pool
    await queryDb(`SELECT upsert_customer($1, $2, $3);`, [
      customer.id,
      customer.email,
      eventAt,
    ]);
  }
}

/**
 * Idempotently handles transaction.completed.
 */
export async function handleTransactionCompleted(
  event: PaddleWebhookEvent<PaddleTransactionData>,
) {
  const tx = event.data;
  console.log(
    `[transaction.completed] Transaction ${tx?.id} completed for customer ${tx?.customerId}`,
  );

  // If customer details are included, ensure customer record is mirrored
  if (tx?.customerId && tx?.customer?.email) {
    await saveCustomer(
      { id: tx.customerId, email: tx.customer.email },
      event.occurredAt,
    );
  }
}
