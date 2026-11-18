"use client";

import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { createPortalSession } from "@/actions/portal";

interface ManageSubscriptionButtonProps {
  /** Tailwind classes to override the default button styling. */
  className?: string;
  /** Button label. Defaults to "Manage Subscription". */
  label?: string;
}

/**
 * Redirects the signed-in user to the Paddle Customer Portal.
 * Mints a fresh portal session on every click (sessions are short-lived and
 * must not be cached).
 *
 * Usage:
 *   <ManageSubscriptionButton />
 *   <ManageSubscriptionButton label="Cancel subscription" className="text-red-400" />
 */
export function ManageSubscriptionButton({
  className,
  label = "Manage Subscription",
}: ManageSubscriptionButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await createPortalSession();

      if ("error" in result) {
        setError(result.error);
        return;
      }

      // Open the Paddle-hosted portal in the same tab.
      // The portal URL is temporary — never store or cache it.
      window.location.href = result.url;
    } catch (err) {
      console.error("[ManageSubscriptionButton]", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className={
          className ??
          "flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        }
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ExternalLink className="w-4 h-4 opacity-60" />
        )}
        {loading ? "Opening portal…" : label}
      </button>

      {error && (
        <p className="text-xs text-red-400 max-w-xs text-center">{error}</p>
      )}
    </div>
  );
}

