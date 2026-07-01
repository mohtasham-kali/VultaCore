"use client";

import { useState, useEffect, Suspense } from "react";
import { Check, Loader2, Sparkles, Zap, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { io, Socket } from "socket.io-client";
import { useSearchParams } from "next/navigation";

const PLANS = [
  {
    id: "Free",
    name: "Free",
    price: "0",
    description: "Perfect for exploring the platform",
    features: [
      "Community Forum Access",
      "Basic AI Chat (5/day)",
      "Public Analytics",
      "Standard Support",
    ],
    buttonText: "Current Plan",
    highlight: false,
    gradient: "from-slate-500 to-slate-600",
  },
  {
    id: "Standard",
    name: "Standard",
    price: "29",
    description: "Best for active developers",
    features: [
      "Priority Forum Support",
      "Pro AI Engine (Gemini)",
      "Personal Analytics",
      "API Access",
    ],
    buttonText: "Upgrade to Standard",
    highlight: true,
    gradient: "from-purple-500 to-blue-500",
  },
  {
    id: "Premium",
    name: "Premium",
    price: "99",
    description: "For security professionals",
    features: [
      "Private Security Hub",
      "Claude 3 & Llama 3 AI",
      "Advanced Threat Intel",
      "Unlimited API Calls",
    ],
    buttonText: "Go Premium",
    highlight: false,
    gradient: "from-amber-500 to-rose-500",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    description: "Custom solutions for teams",
    features: [
      "SLA Guarantees",
      "Dedicated AI Instance",
      "White-label Options",
      "24/7 Phone Support",
    ],
    buttonText: "Contact Sales",
    highlight: false,
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
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [currentPlan, setCurrentPlan] = useState<string>("Free");
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [justUpgraded, setJustUpgraded] = useState(false);

  // Detect return from Lemon Squeezy checkout
  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      setJustUpgraded(true);
      setTimeout(() => setJustUpgraded(false), 5000);
    }
  }, [searchParams]);

  // Real-time WebSocket subscription sync
  useEffect(() => {
    if (!user?.id) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const socket: Socket = io(apiUrl, { transports: ["websocket"] });

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

  // Fetch current plan from backend on load
  useEffect(() => {
    if (!user?.id) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    fetch(`${apiUrl}/users/${user.id}`)
      .then((r) => r.json())
      .then((u) => {
        if (u?.rank) setCurrentPlan(u.rank);
      })
      .catch(() => {});
  }, [user]);

  const handleUpgrade = async (planId: string, planName: string) => {
    if (planId === "enterprise") {
      window.location.href = "mailto:sales@vultacore.com?subject=Enterprise Plan Inquiry";
      return;
    }

    if (planName === currentPlan) return;

    if (!user?.id || !user?.email) {
      alert("Please log in to upgrade your plan.");
      return;
    }

    try {
      setUpgradingPlan(planId);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

      const res = await fetch(`${apiUrl}/api/billing/checkout`, {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planName,
          userId: user.id,
          userEmail: user.email,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create checkout session.");
      }

      const { checkoutUrl } = await res.json();

      // Redirect to Lemon Squeezy hosted checkout
      // Supports: Credit/Debit cards, PayPal, Google Pay, Apple Pay
      window.location.href = checkoutUrl;
    } catch (err: unknown) {
      console.error("Checkout Error:", err);
      alert(`Checkout failed: ${(err as Error).message}`);
      setUpgradingPlan(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
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
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center animate-in fade-in slide-in-from-top-2 duration-500">
            <p className="text-emerald-400 font-semibold text-sm">
              🎉 Payment successful! Your plan is being activated. It will update automatically in a few seconds.
            </p>
          </div>
        )}

        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
          Your{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            Subscription
          </span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Secure payments powered by{" "}
          <span className="text-yellow-400 font-semibold">Lemon Squeezy</span>.
          Pay with card, PayPal, Google Pay or Apple Pay.
        </p>

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

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {PLANS.map((plan) => {
          const isCurrentPlan =
            plan.name.toLowerCase() === currentPlan.toLowerCase();
          const isLoading = upgradingPlan === plan.id;

          return (
    <div
              key={plan.id}
              className={cn(
                "relative flex flex-col p-8 rounded-3xl border transition-all duration-500 overflow-hidden",
                isCurrentPlan
                  ? "bg-gradient-to-b from-indigo-900/40 to-slate-900 border-indigo-500/50 shadow-[0_0_40px_rgba(99,102,241,0.2)] scale-105"
                  : plan.highlight
                  ? "bg-slate-900 border-purple-500/50 shadow-2xl shadow-purple-500/10 ring-1 ring-purple-500/20 hover:scale-[1.02]"
                  : "bg-slate-900/50 border-white/10 hover:border-white/20 hover:scale-[1.02]"
              )}
            >
              {/* Active plan top bar */}
              {isCurrentPlan && (

                <div
                  className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${plan.gradient}`}
                />
              )}

              {/* Popular badge */}
              {plan.highlight && !isCurrentPlan && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Most Popular
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
                    {plan.id === "enterprise" ? "" : "$"}
                    {plan.price}
                  </span>
                  {plan.id !== "enterprise" && plan.price !== "0" && (
                    <span className="text-slate-500 font-medium">/mo</span>
                  )}
                </div>
                <p className="text-slate-400 text-sm mt-4 leading-relaxed">
                  {plan.description}
                </p>
              </div>

              {/* Features */}
              <div className="flex-1 space-y-4 mb-8 relative z-10">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className={cn(
                        "mt-1 p-0.5 rounded-full border",
                        isCurrentPlan
                          ? "bg-indigo-500/10 border-indigo-500/30"
                          : "bg-emerald-500/10 border-emerald-500/20"
                      )}
                    >
                      <Check
                        className={cn(
                          "w-3 h-3",
                          isCurrentPlan ? "text-indigo-400" : "text-emerald-400"
                        )}
                      />
                    </div>
                    <span className="text-sm text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <button
                onClick={() => handleUpgrade(plan.id, plan.name)}
                disabled={isCurrentPlan || isLoading}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-2 relative z-10",
                  isCurrentPlan
                    ? "bg-white/5 text-slate-400 cursor-not-allowed border border-white/5"
                    : plan.highlight
                    ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-xl shadow-purple-500/20 hover:opacity-90 active:scale-95"
                    : `bg-gradient-to-r ${plan.gradient} text-white opacity-80 hover:opacity-100 active:scale-95`
                )}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isCurrentPlan ? (
                  "Current Plan"
                ) : plan.id === "enterprise" ? (
                  "Contact Sales"
                ) : (
                  <>
                    {plan.buttonText}
                    <ExternalLink className="w-4 h-4 opacity-70" />
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Powered by footer */}
      <div className="mt-16 text-center">
        <p className="text-slate-600 text-xs">
          Payments securely processed by{" "}
          <a
            href="https://lemonsqueezy.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-yellow-500/70 hover:text-yellow-400 transition-colors"
          >
            Lemon Squeezy
          </a>{" "}
          · All prices in USD · Cancel anytime
        </p>
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
        <p className="text-slate-500 animate-pulse uppercase tracking-widest text-xs font-bold">Loading Subscription...</p>
      </div>
    }>
      <SubscriptionPageClient />
    </Suspense>
  );
}
