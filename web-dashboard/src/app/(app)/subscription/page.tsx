"use client";

import { useState, useEffect, Suspense } from "react";
import { Check, Loader2, Sparkles, Zap, ExternalLink, ShieldCheck } from "lucide-react";
import { ManageSubscriptionButton } from "@/components/manage-subscription-button";
import { EnterpriseContactModal } from "@/components/subscription/EnterpriseContactModal";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { io, Socket } from "socket.io-client";
import { useSearchParams } from "next/navigation";
import { initializePaddle, type Paddle, type Environments } from "@paddle/paddle-js";
import { API_BASE_URL, SOCKET_URL } from "@/lib/constants";
import { getUserSubscription } from "@/utils/paddle/get-user-subscription";
import { hasActiveSubscription } from "@/utils/paddle/access";
import { createPortalSession } from "@/actions/portal";

const PLAN_RANKS: Record<string, number> = {
  free: 0,
  standard: 1,
  premium: 2,
  enterprise: 3,
};

interface DynamicPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  interval: string;
  isCustomPricing: boolean;
  isRecommended: boolean;
  badge?: string;
  features: string[];
  gradient?: string;
}

const FALLBACK_PLANS: DynamicPlan[] = [
  {
    id: "Free",
    name: "Free",
    slug: "free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: "USD",
    interval: "month",
    isCustomPricing: false,
    description: "Perfect for exploring the platform and community.",
    features: [
      "Community Forum Access",
      "Basic AI Chat (5 msgs / day)",
      "Public Analytics & Leaderboards",
      "Standard Community Support",
    ],
    isRecommended: false,
    gradient: "from-slate-500 to-slate-600",
  },
  {
    id: "Standard",
    name: "Standard",
    slug: "standard",
    monthlyPrice: 29,
    yearlyPrice: 348,
    currency: "USD",
    interval: "both",
    isCustomPricing: false,
    description: "Best for active developers and daily code synthesis.",
    features: [
      "Priority Developer Forum Support",
      "Pro AI Engine (Gemini Pro)",
      "Personal Real-Time Analytics",
      "REST & WebSocket API Access",
      "Unlimited Daily Inquiries",
      "7-day free trial included",
    ],
    isRecommended: true,
    badge: "Most Popular",
    gradient: "from-purple-500 to-blue-500",
  },
  {
    id: "Premium",
    name: "Premium",
    slug: "premium",
    monthlyPrice: 99,
    yearlyPrice: 1188,
    currency: "USD",
    interval: "both",
    isCustomPricing: false,
    description: "For security professionals and threat researchers.",
    features: [
      "Private Security Hub (AST & Scans)",
      "Claude 3 & Llama 3 Security Models",
      "Real-Time Vulnerability Feeds",
      "Advanced Threat Intelligence",
      "Unlimited API Calls",
      "Priority Email & Slack Support",
    ],
    isRecommended: false,
    badge: "Advanced Security",
    gradient: "from-amber-500 to-rose-500",
  },
  {
    id: "Enterprise",
    name: "Enterprise",
    slug: "enterprise",
    monthlyPrice: 299,
    yearlyPrice: 3588,
    currency: "USD",
    interval: "both",
    isCustomPricing: true,
    description: "Tailored infrastructure and custom SLA guarantees.",
    features: [
      "SLA Guarantees (99.9% Uptime)",
      "Dedicated Private AI Instance",
      "White-label & Custom Domain Options",
      "24/7 Phone & Slack Support",
      "Custom Vendor Security Audits",
    ],
    isRecommended: false,
    badge: "Enterprise Grade",
    gradient: "from-emerald-500 to-teal-500",
  },
];

const PAYMENT_METHODS = [
  { name: "Visa / Mastercard", icon: "💳" },
  { name: "PayPal", icon: "🅿️" },
  { name: "Google Pay", icon: "G" },
  { name: "Apple Pay", icon: "🍎" },
];

function SubscriptionPageClient() {
  const { user, session } = useAuth();
  const searchParams = useSearchParams();
  const [plans, setPlans] = useState<DynamicPlan[]>(FALLBACK_PLANS);
  const [currentPlan, setCurrentPlan] = useState<string>("Free");
  const [billingCycle, setBillingCycle] = useState<"month" | "year">("month");
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [justUpgraded, setJustUpgraded] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isEnterpriseModalOpen, setIsEnterpriseModalOpen] = useState(false);
  const [paddle, setPaddle] = useState<Paddle | undefined>();

  // Detect return from Paddle checkout
  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      setJustUpgraded(true);
      setTimeout(() => setJustUpgraded(false), 5000);
    }
  }, [searchParams]);

  // Initialize Paddle.js and handle _ptxn parameter
  useEffect(() => {
    const paddleEnv = process.env.NEXT_PUBLIC_PADDLE_ENV;
    const paddleToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    if (!paddleEnv || !paddleToken) return;

    initializePaddle({
      token: paddleToken,
      environment: paddleEnv as Environments,
    })
      .then((p) => {
        if (p) {
          setPaddle(p);
          const ptxn = searchParams.get("_ptxn");
          if (ptxn) {
            p.Checkout.open({
              transactionId: ptxn,
              settings: {
                displayMode: "overlay",
                theme: "dark",
                successUrl: `${window.location.origin}/subscription?upgraded=true`,
              },
            });
          }
        }
      })
      .catch((err) => console.error("Paddle init error on subscription page:", err));
  }, [searchParams]);

  // Fetch published plans dynamically from database
  useEffect(() => {
    fetch(`${API_BASE_URL}/plans/published`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch published plans");
        return res.json();
      })
      .then((data: any[]) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped: DynamicPlan[] = data.map((p) => {
            let featureList: string[] = [];
            if (p.planFeatures && Array.isArray(p.planFeatures)) {
              featureList = p.planFeatures
                .filter((pf: any) => pf.isEnabled && pf.feature)
                .map((pf: any) => {
                  if (pf.limitValue) {
                    return `${pf.feature.name} (${pf.limitValue}/day)`;
                  }
                  return pf.feature.name;
                });
            } else if (Array.isArray(p.features) && p.features.length > 0) {
              featureList = p.features;
            }

            let grad = "from-slate-500 to-slate-600";
            const lower = p.name.toLowerCase();
            if (lower.includes("standard")) grad = "from-purple-500 to-blue-500";
            if (lower.includes("premium")) grad = "from-amber-500 to-rose-500";
            if (lower.includes("enterprise")) grad = "from-emerald-500 to-teal-500";

            return {
              id: p.id || p.name,
              name: p.name,
              slug: p.slug || p.name.toLowerCase(),
              description: p.description || "",
              monthlyPrice: Number(p.monthlyPrice ?? p.price ?? 0),
              yearlyPrice: Number(p.yearlyPrice ?? (p.monthlyPrice ? p.monthlyPrice * 12 : 0)),
              currency: p.currency || "USD",
              interval: p.interval || "both",
              isCustomPricing: Boolean(p.isCustomPricing),
              isRecommended: Boolean(p.isRecommended),
              badge: p.badge || (p.isRecommended ? "Recommended" : undefined),
              features: featureList,
              gradient: grad,
            };
          });
          setPlans(mapped);
        }
      })
      .catch((err) => console.warn("Using fallback plans:", err));
  }, []);

  // Real-time WebSocket subscription sync
  useEffect(() => {
    if (!user?.id) return;

    const socket: Socket = io(SOCKET_URL, { transports: ["websocket"] });

    socket.on("connect", () => {
      setIsSocketConnected(true);
      socket.emit("subscribeToUserEvents", user.id);
    });

    socket.on("subscriptionUpdated", (data: { newRank: string }) => {
      console.log("⚡ Plan updated in real-time:", data.newRank);
      setCurrentPlan(data.newRank);
      setUpgradingPlan(null);
    });

    socket.on("disconnect", () => setIsSocketConnected(false));

    return () => {
      socket.disconnect();
    };
  }, [user]);

  // Fetch current plan from backend & entitlements
  useEffect(() => {
    if (!user?.id) return;

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
            "pri_01m7r11zk5c3bma7a6k0y70g5n": "Standard",
            "pri_01m7zg022mbd9npg4k7d9462w4": "Standard",
            "pri_01m7r12e4rwbrt25331y3sm88p": "Premium",
            "pri_01m7zga0kvb5ycrvpa9mw8n1f1": "Premium",
            "pri_01m7zga1swv0y3tfj78g7bkqvj": "Enterprise",
            "pri_01m7zga22j5raphwqxbe31fgex": "Enterprise",
            "pri_01m7zga17631vansgnv8844tqp": "Free",
          };
          const resolved = planMap[sub.price_id];
          if (resolved) {
            setCurrentPlan(resolved);
          }
        }
      })
      .catch(() => {});
  }, [user, session]);

  const handleAction = async (plan: DynamicPlan) => {
    if (plan.isCustomPricing || plan.name.toLowerCase() === "enterprise") {
      setIsEnterpriseModalOpen(true);
      return;
    }

    if (plan.name.toLowerCase() === currentPlan.toLowerCase()) return;

    if (!user?.id || !user?.email) {
      setCheckoutError("Please log in to manage your plan.");
      return;
    }

    const planKey = plan.name.toLowerCase();
    const currentKey = currentPlan.toLowerCase();
    const planRank = PLAN_RANKS[planKey] ?? 0;
    const currentRank = PLAN_RANKS[currentKey] ?? 0;

    // Downgrade to lower tier -> open customer portal
    if (planRank < currentRank) {
      try {
        setUpgradingPlan(plan.id);
        const result = await createPortalSession();
        if ("error" in result) {
          throw new Error(result.error);
        }
        window.location.href = result.url;
        return;
      } catch (err: any) {
        console.error("Portal Error:", err);
        setCheckoutError(err.message || "Failed to open subscription management portal.");
        setUpgradingPlan(null);
        return;
      }
    }

    // Upgrade to higher tier
    try {
      setUpgradingPlan(plan.id);

      const res = await fetch(`${API_BASE_URL}/billing/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planName: plan.name,
          userId: user.id,
          userEmail: user.email,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || err.error || "Failed to create checkout session.");
      }

      const { checkoutUrl } = await res.json();
      const ptxnMatch = checkoutUrl ? checkoutUrl.match(/[?&]_ptxn=([a-zA-Z0-9_]+)/) : null;
      const ptxn = ptxnMatch ? ptxnMatch[1] : null;

      if (paddle && ptxn) {
        paddle.Checkout.open({
          transactionId: ptxn,
          settings: {
            displayMode: "overlay",
            theme: "dark",
            successUrl: `${window.location.origin}/subscription?upgraded=true`,
          },
        });
        setUpgradingPlan(null);
        return;
      }

      window.location.href = checkoutUrl;
    } catch (err: unknown) {
      console.error("Checkout Error:", err);
      setCheckoutError(`Checkout failed: ${(err as Error).message}`);
      setUpgradingPlan(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Enterprise Contact Sales Modal */}
      <EnterpriseContactModal
        isOpen={isEnterpriseModalOpen}
        onClose={() => setIsEnterpriseModalOpen(false)}
        userEmail={user?.email || ""}
        userId={user?.id || ""}
      />

      {/* Header */}
      <div className="text-center mb-16 space-y-4">
        {/* Live Sync Indicator */}
        <div className="fixed top-24 right-8 flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 z-50">
          {isSocketConnected ? (
            <>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.7)]" />
              Live Sync
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-slate-500" />
              Offline
            </>
          )}
        </div>

        {/* Just-upgraded banner */}
        {justUpgraded && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center animate-in fade-in duration-500">
            <p className="text-emerald-400 font-semibold text-sm">
              🎉 Payment successful! Your plan is being activated. It will update automatically in a few seconds.
            </p>
          </div>
        )}

        {/* Checkout error banner */}
        {checkoutError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-center">
            <p className="text-red-400 font-semibold text-sm">⚠️ {checkoutError}</p>
          </div>
        )}

        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
          Your{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            Subscription
          </span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Dynamically managed plans backed by enterprise-grade entitlement controls.
        </p>

        {/* Billing Cycle Toggle */}
        <div className="pt-2 flex justify-center items-center">
          <div className="inline-flex p-1 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setBillingCycle("month")}
              className={cn(
                "px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
                billingCycle === "month"
                  ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/20"
                  : "text-slate-400 hover:text-white",
              )}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("year")}
              className={cn(
                "px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2",
                billingCycle === "year"
                  ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/20"
                  : "text-slate-400 hover:text-white",
              )}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                SAVE 20%
              </span>
            </button>
          </div>
        </div>

        {/* Accepted payment methods */}
        <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
          {PAYMENT_METHODS.map((m) => (
            <div
              key={m.name}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 border border-white/10 rounded-full text-xs text-slate-300"
            >
              <span>{m.icon}</span>
              {m.name}
            </div>
          ))}
        </div>

        {!user?.id && (
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-center">
            <p className="text-blue-400 text-sm font-medium">
              Please{" "}
              <a href="/auth" className="underline font-bold">
                log in
              </a>{" "}
              to manage your subscription.
            </p>
          </div>
        )}
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {plans.map((plan) => {
          const planKey = plan.name.toLowerCase();
          const currentKey = currentPlan.toLowerCase();
          const planRank = PLAN_RANKS[planKey] ?? 0;
          const currentRank = PLAN_RANKS[currentKey] ?? 0;

          const isCurrentPlan = planKey === currentKey;
          const isDowngrade = !isCurrentPlan && planRank < currentRank;
          const isUpgrade = !isCurrentPlan && planRank > currentRank && !plan.isCustomPricing;
          const isLoading = upgradingPlan === plan.id;

          let buttonText = "Get Started";
          if (isCurrentPlan) {
            buttonText = "Current Plan";
          } else if (plan.isCustomPricing || planKey === "enterprise") {
            buttonText = "Contact Sales";
          } else if (isDowngrade) {
            buttonText = `Downgrade to ${plan.name}`;
          } else if (isUpgrade) {
            buttonText = `Upgrade to ${plan.name}`;
          }

          const priceDisplay = plan.isCustomPricing
            ? "Custom"
            : billingCycle === "year"
            ? `$${Math.round(plan.yearlyPrice / 12)}`
            : `$${plan.monthlyPrice}`;

          return (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col p-8 rounded-3xl border transition-all duration-500 overflow-hidden",
                isCurrentPlan
                  ? "bg-gradient-to-b from-indigo-900/40 to-slate-900 border-indigo-500/50 shadow-[0_0_40px_rgba(99,102,241,0.2)] scale-105"
                  : plan.isRecommended
                  ? "bg-slate-900 border-purple-500/50 shadow-2xl shadow-purple-500/10 ring-1 ring-purple-500/20 hover:scale-[1.02]"
                  : "bg-slate-900/50 border-white/10 hover:border-white/20 hover:scale-[1.02]",
              )}
            >
              {/* Active plan top bar */}
              {isCurrentPlan && (
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${plan.gradient || "from-purple-500 to-blue-500"}`} />
              )}

              {/* Recommended badge */}
              {plan.badge && !isCurrentPlan && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> {plan.badge}
                </div>
              )}

              {/* Plan info */}
              <div className="mb-8 relative z-10">
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  {plan.name}
                  {isCurrentPlan && (
                    <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Active
                    </span>
                  )}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">
                    {priceDisplay}
                  </span>
                  {!plan.isCustomPricing && plan.monthlyPrice > 0 && (
                    <span className="text-slate-500 font-medium">/mo</span>
                  )}
                </div>
                <p className="text-slate-400 text-sm mt-4 leading-relaxed">
                  {plan.description}
                </p>
              </div>

              {/* Features List */}
              <div className="flex-1 space-y-4 mb-8 relative z-10">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className={cn(
                        "mt-1 p-0.5 rounded-full border",
                        isCurrentPlan
                          ? "bg-indigo-500/10 border-indigo-500/30"
                          : "bg-emerald-500/10 border-emerald-500/20",
                      )}
                    >
                      <Check
                        className={cn(
                          "w-3 h-3",
                          isCurrentPlan ? "text-indigo-400" : "text-emerald-400",
                        )}
                      />
                    </div>
                    <span className="text-sm text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleAction(plan)}
                disabled={isCurrentPlan || isLoading}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-2 relative z-10",
                  isCurrentPlan
                    ? "bg-white/5 text-slate-400 cursor-not-allowed border border-white/5"
                    : isDowngrade
                    ? "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 hover:border-white/20 active:scale-95"
                    : plan.isRecommended
                    ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-xl shadow-purple-500/20 hover:opacity-90 active:scale-95"
                    : `bg-gradient-to-r ${plan.gradient || "from-purple-500 to-blue-500"} text-white opacity-90 hover:opacity-100 active:scale-95`,
                )}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isCurrentPlan ? (
                  "Current Plan"
                ) : plan.isCustomPricing || planKey === "enterprise" ? (
                  "Contact Sales"
                ) : (
                  <>
                    {buttonText}
                    <ExternalLink className="w-4 h-4 opacity-70" />
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Customer Portal Management for active subscribers */}
      <div className="mt-16 text-center">
        <ManageSubscriptionButton />
      </div>

      {/* Security & Merchant of Record Note */}
      <div className="mt-12 p-8 rounded-3xl bg-slate-900/40 border border-white/5 text-center max-w-3xl mx-auto space-y-4">
        <div className="flex justify-center items-center gap-2 text-purple-400">
          <ShieldCheck className="w-6 h-6" />
          <span className="font-semibold text-white">Paddle Merchant of Record &amp; Dynamic Gating</span>
        </div>
        <p className="text-slate-400 text-sm leading-relaxed">
          All transactions are processed through Paddle with automated tax compliance, 256-bit SSL encryption, and instant entitlement provisioning.
        </p>
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      }
    >
      <SubscriptionPageClient />
    </Suspense>
  );
}
