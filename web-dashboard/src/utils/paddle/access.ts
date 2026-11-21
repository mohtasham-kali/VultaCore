export interface MirroredSubscription {
  subscription_id: string;
  customer_id: string;
  user_id?: string | null;
  subscription_status: string;
  price_id: string;
  product_id: string;
  scheduled_change_action?: string | null;
  scheduled_change_effective_at?: string | null;
  paddle_created_at: string;
  last_event_at?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Decides whether a subscription currently grants paid access.
 *
 * Rules:
 * - Treat 'active' AND 'trialing' as access-granting.
 * - 'past_due' retains access with a warning banner during dunning retries.
 * - Do NOT revoke access just because a scheduled_change to cancel or pause exists.
 *   Only revoke when status is actually 'canceled' or 'paused'.
 */
export function hasActiveSubscription(
  sub:
    | MirroredSubscription
    | { subscription_status: string }
    | string
    | null
    | undefined,
): boolean {
  if (!sub) return false;
  const status = typeof sub === "string" ? sub : sub.subscription_status;
  return ["active", "trialing", "past_due"].includes(status);
}

/**
 * Strict access check for active or trialing only.
 */
export function isStrictlyActiveOrTrialing(
  status: string | null | undefined,
): boolean {
  if (!status) return false;
  return status === "active" || status === "trialing";
}

/**
 * UI State helper for account / subscription views.
 */
export function getSubscriptionUiState(
  sub: MirroredSubscription | null | undefined,
): {
  hasAccess: boolean;
  status: string;
  isCancelScheduled: boolean;
  isPauseScheduled: boolean;
  isResumeScheduled: boolean;
  cancelEffectiveAt: string | null;
  message: string;
} {
  if (!sub) {
    return {
      hasAccess: false,
      status: "none",
      isCancelScheduled: false,
      isPauseScheduled: false,
      isResumeScheduled: false,
      cancelEffectiveAt: null,
      message: "No active subscription",
    };
  }

  const hasAccess = hasActiveSubscription(sub);
  const isCancelScheduled = sub.scheduled_change_action === "cancel";
  const isPauseScheduled = sub.scheduled_change_action === "pause";
  const isResumeScheduled = sub.scheduled_change_action === "resume";

  let message = `Status: ${sub.subscription_status}`;
  if (isCancelScheduled && sub.scheduled_change_effective_at) {
    message = `Subscription active until ${new Date(sub.scheduled_change_effective_at).toLocaleDateString()}`;
  } else if (sub.subscription_status === "past_due") {
    message = "Payment is past due. Please update your payment method.";
  } else if (sub.subscription_status === "paused") {
    message = "Subscription is currently paused.";
  } else if (sub.subscription_status === "canceled") {
    message = "Subscription has been canceled.";
  }

  return {
    hasAccess,
    status: sub.subscription_status,
    isCancelScheduled,
    isPauseScheduled,
    isResumeScheduled,
    cancelEffectiveAt: sub.scheduled_change_effective_at ?? null,
    message,
  };
}

