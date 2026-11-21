"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ShieldCheck, Zap, Sparkles, Loader2 } from "lucide-react";
import { initializePaddle, type Paddle, type Environments } from "@paddle/paddle-js";
import { useAuth } from "@/context/AuthContext";
import { PricingTiers, type Tier } from "@/constants/pricing-tier";
import { usePaddlePrices } from "@/hooks/usePaddlePrices";
import { API_BASE_URL } from "@/lib/constants";
import { getUserSubscription } from "@/utils/paddle/get-user-subscription";
import { hasActiveSubscription } from "@/utils/paddle/access";
import { createPortalSession } from "@/actions/portal";

const PLAN_RANKS: Record<string, number> = {
  free: 0,
  standard: 1,
  premium: 2,
  enterprise: 3,
};

interface PricingClientProps {
  initialCountry?: string | null;
  initialCustomerId?: string | null;
}

export function PricingClient({ initialCountry, initialCustomerId }: PricingClientProps) {
  const { user, session } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<string>("Free");
  const [actionLoadingTier, setActionLoadingTier] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<"month" | "year">("month");
  const [paddle, setPaddle] = useState<Paddle | undefined>();
  const [paddleInitError, setPaddleInitError] = useState<string | null>(null);

  // Sync current plan from backend and mirrored Paddle subscription
  useEffect(() => {
    if (!user?.id) {
      setCurrentPlan("Free");
      return;
    }

    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }

    fetch(`${API_BASE_URL}/users/${user.id}`, { headers })
      .then((r) => r.json())
      .then((u) => {
        if (u?.rank) setCurrentPlan(u.rank);
      })
      .catch(() => {});

    getUserSubscription()
      .then((sub) => {
        if (sub && hasActiveSubscription(sub)) {
          const planMap: Record<string, string> = {
            // Live Prices
            "pri_01m7r11zk5c3bma7a6k0y70g5n": "Standard",
            "pri_01m7zg022mbd9npg4k7d9462w4": "Standard",
            "pri_01m7r12e4rwbrt25331y3sm88p": "Premium",
            "pri_01m7zga0kvb5ycrvpa9mw8n1f1": "Premium",
            "pri_01m7zga1swv0y3tfj78g7bkqvj": "Enterprise",
            "pri_01m7zga22j5raphwqxbe31fgex": "Enterprise",
            "pri_01m7zga17631vansgnv8844tqp": "Free",
            // Sandbox Prices fallback
            "pri_01m7r41d01n8xa18z8kzwhchv1": "Standard",
            "pri_01m7r41d7yphdthpr9jhkw3b00": "Standard",
            "pri_01m7r41dwfzw108seb2ptyvzrh": "Premium",
            "pri_01m7r41e4p5a3w63m65b6ewd05": "Premium",
            "pri_01m7r41epjb34524nsn3nebdym": "Enterprise",
            "pri_01m7r6d5fzz6397fsw4c5a3xx4": "Free",
          };
          const resolved = planMap[sub.price_id];
          if (resolved) {
            setCurrentPlan(resolved);
          }
        }
      })
      .catch(() => {});
  }, [user, session]);

  // Validate environment variables strictly without silent defaults
  const paddleEnv = process.env.NEXT_PUBLIC_PADDLE_ENV;
  const paddleToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;

  useEffect(() => {
    if (!paddleEnv) {
      const err = "NEXT_PUBLIC_PADDLE_ENV is not configured. Must be set to 'sandbox' or 'production'.";
      console.error(err);
      setPaddleInitError(err);
      return;
    }

    if (!paddleToken) {
      const err = "NEXT_PUBLIC_PADDLE_CLIENT_TOKEN is not configured. Must be set to a client-side token.";
      console.error(err);
      setPaddleInitError(err);
      return;
    }
    initializePaddle({
      token: paddleToken,
      environment: paddleEnv as Environments,
      ...(initialCustomerId && initialCustomerId.startsWith("ctm_")
        ? { pwCustomer: { id: initialCustomerId } }
        : {}),
    })
      .then((p) => {
        if (p) {
          setPaddle(p);
        }
      })
      .catch((err) => {
        console.error("Failed to initialize Paddle.js:", err);
        setPaddleInitError("Failed to initialize payment system. Please refresh or try again later.");
      });
  }, [paddleEnv, paddleToken]);

  const { prices, loading: pricesLoading, error: pricesError } = usePaddlePrices(
    paddle,
    initialCountry
  );

  const handleSubscribe = async (tier: Tier) => {
    const planKey = tier.name.toLowerCase();
    const currentKey = currentPlan.toLowerCase();
    const planRank = PLAN_RANKS[planKey] ?? 0;
    const currentRank = PLAN_RANKS[currentKey] ?? 0;

    if (user?.id && planKey === currentKey) return;

    if (tier.name === "Enterprise") {
      const subject = encodeURIComponent("Enterprise Plan Inquiry - VultaCore");
      const body = encodeURIComponent(
        `Hi TechProgression Sales Team,\n\nI would like to inquire about the VultaCore Enterprise Plan.\n\nMy Account Details:\n- Email: ${user?.email ?? "N/A"}\n- Username: ${user?.user_metadata?.username ?? user?.email?.split("@")[0] ?? "N/A"}\n- User ID: ${user?.id ?? "N/A"}\n\nPlease contact me to discuss custom pricing and onboarding.\n\nThank you!`
      );
      window.open(`mailto:sales@techprogression.com?subject=${subject}&body=${body}`, "_blank");
      return;
    }

    // Downgrade flow (e.g. to Free or to a lower paid tier)
    if (user?.id && planRank < currentRank) {
      try {
        setActionLoadingTier(tier.name);
        const result = await createPortalSession();
        if ("error" in result) {
          throw new Error(result.error);
        }
        window.location.href = result.url;
        return;
      } catch (err: any) {
        console.error("Portal Error:", err);
        setPaddleInitError(err.message || "Failed to open subscription management portal.");
        setActionLoadingTier(null);
        return;
      }
    }

    if (tier.name === "Free") {
      window.location.href = user ? "/dashboard" : "/auth";
      return;
    }

    if (!user) {
      window.location.href = "/auth";
      return;
    }

    if (!paddle) {
      console.error("Paddle is not initialized yet.");
      return;
    }

    const priceId = tier.priceId[frequency];
    const successUrl = `${window.location.origin}/subscription?upgraded=true`;

    paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      settings: {
        displayMode: "overlay",
        variant: "one-page",
        successUrl,
      },
      ...(user?.email ? { customer: { email: user.email } } : {}),
      customData: {
        userId: user?.id ?? "",
        user_id: user?.id ?? "",
        plan_name: tier.name,
      },
    });
  };

  return (
    <div className="relative z-10 container mx-auto px-6 py-16 max-w-7xl">
      {/* Top Navigation & Header */}
      <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
        <Link href="/" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
          ← Back to VultaCore
        </Link>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
          Predictable Pricing for{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            High-Performance
          </span>{" "}
          Teams
        </h1>
        <p className="text-slate-400 text-lg">
          Choose the plan that fits your development and security workflows. All plans include automated
          Paddle-backed localized billing with a 14-day guarantee.
        </p>

        {/* Billing Frequency Toggle */}
        <div className="pt-4 flex justify-center items-center">
          <div className="inline-flex p-1 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setFrequency("month")}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                frequency === "month"
                  ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setFrequency("year")}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                frequency === "year"
                  ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                SAVE 20%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Error Banners if env or price retrieval failed */}
      {paddleInitError && (
        <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-center">
          <p className="text-red-400 font-semibold text-sm">⚠️ {paddleInitError}</p>
        </div>
      )}

      {pricesError && (
        <div className="max-w-2xl mx-auto mb-8 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-center">
          <p className="text-amber-400 font-semibold text-sm">⚠️ {pricesError}</p>
        </div>
      )}

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {PricingTiers.map((tier) => {
          const currentPriceId = tier.priceId[frequency];
          const formattedPrice = prices[currentPriceId];

          const planKey = tier.name.toLowerCase();
          const currentKey = currentPlan.toLowerCase();
          const planRank = PLAN_RANKS[planKey] ?? 0;
          const currentRank = PLAN_RANKS[currentKey] ?? 0;

          const isCurrentPlan = Boolean(user?.id && planKey === currentKey);
          const isDowngrade = Boolean(user?.id && !isCurrentPlan && planRank < currentRank);
          const isUpgrade = Boolean(user?.id && !isCurrentPlan && planRank > currentRank && tier.name !== "Enterprise");
          const isActionLoading = actionLoadingTier === tier.name;

          let buttonText = `Subscribe to ${tier.name}`;
          if (isCurrentPlan) {
            buttonText = "Current Plan";
          } else if (tier.name === "Enterprise") {
            buttonText = "Contact Sales";
          } else if (isDowngrade) {
            buttonText = `Downgrade to ${tier.name}`;
          } else if (isUpgrade) {
            buttonText = `Upgrade to ${tier.name}`;
          } else if (tier.name === "Free") {
            buttonText = user?.id ? "Current Plan" : "Get Started Free";
          }

          return (
            <div
              key={tier.name}
              className={`relative flex flex-col p-8 rounded-2xl bg-white/5 border ${
                isCurrentPlan
                  ? "border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.2)]"
                  : tier.highlight
                    ? "border-purple-500/60 shadow-2xl shadow-purple-500/10"
                    : "border-white/10"
              } transition-all duration-300 hover:-translate-y-1`}
            >
              {tier.badge && !isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-bold rounded-full uppercase tracking-wider">
                  {tier.badge}
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                  {tier.name}
                  {isCurrentPlan && (
                    <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Active
                    </span>
                  )}
                </h3>
                <p className="text-slate-400 text-sm min-h-[40px]">{tier.description}</p>
              </div>

              {/* Price Display — strictly Paddle's formattedTotals */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  {tier.name === "Free" ? (
                    <span className="text-4xl font-extrabold text-white tracking-tight">$0</span>
                  ) : pricesLoading || !formattedPrice ? (
                    <span className="text-3xl font-extrabold text-slate-500 animate-pulse">...</span>
                  ) : (
                    <span className="text-4xl font-extrabold text-white tracking-tight">
                      {formattedPrice}
                    </span>
                  )}
                  {tier.name !== "Free" && (
                    <span className="text-slate-400 text-sm ml-1.5">
                      / {frequency === "month" ? "month" : "year"}
                    </span>
                  )}
                </div>
              </div>

              {/* Features List */}
              <div className="flex-1 space-y-3 mb-8">
                {tier.features.map((feature, fi) => (
                  <div key={fi} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              {/* Action CTA Button */}
              <button
                type="button"
                onClick={() => handleSubscribe(tier)}
                disabled={isCurrentPlan || isActionLoading || (!paddle && pricesLoading && tier.name !== "Enterprise" && tier.name !== "Free")}
                className={`w-full py-3.5 px-4 rounded-xl font-semibold text-center text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  isCurrentPlan
                    ? "bg-white/5 text-slate-400 cursor-not-allowed border border-white/5"
                    : isDowngrade
                      ? "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 hover:border-white/20 active:scale-[0.98]"
                      : tier.highlight
                        ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:brightness-110 shadow-lg shadow-purple-500/25 active:scale-[0.98]"
                        : "bg-white/10 text-white hover:bg-white/20 border border-white/10 active:scale-[0.98]"
                } ${isCurrentPlan || isActionLoading ? "cursor-not-allowed" : ""}`}
              >
                {isActionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                    <span>Processing...</span>
                  </>
                ) : !paddle && pricesLoading && tier.name !== "Enterprise" && tier.name !== "Free" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                    <span>Loading...</span>
                  </>
                ) : isCurrentPlan ? (
                  <span>Current Plan</span>
                ) : tier.name === "Enterprise" ? (
                  <span>Contact Sales</span>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-purple-300" />
                    <span>{buttonText}</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Security & Merchant of Record Note */}
      <div className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center max-w-3xl mx-auto space-y-4">
        <div className="flex justify-center items-center gap-2 text-purple-400">
          <ShieldCheck className="w-6 h-6" />
          <span className="font-semibold text-white">Merchant of Record &amp; Secure Checkout</span>
        </div>
        <p className="text-slate-400 text-sm leading-relaxed">
          All transactions and payments are securely handled by our online reseller and Merchant of Record,{" "}
          <strong className="text-white">Paddle.com</strong>. We support Credit/Debit Cards, PayPal, Apple
          Pay, and Google Pay with full 256-bit SSL encryption.
        </p>
        <div className="flex justify-center gap-6 text-xs text-slate-500">
          <Link href="/terms" className="hover:text-purple-400 underline">
            Terms of Service
          </Link>
          <Link href="/privacy" className="hover:text-purple-400 underline">
            Privacy Policy
          </Link>
          <Link href="/refund" className="hover:text-purple-400 underline">
            Refund Policy
          </Link>
        </div>
      </div>
    </div>
  );
}

