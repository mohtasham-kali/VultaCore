"use client";

import { useState, useEffect } from "react";
import { Check, Loader2, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { io, Socket } from "socket.io-client";
import { Purchases, Package } from "@revenuecat/purchases-js";

// MOCK RevenueCat API Key
const RC_WEB_API_KEY = "appb0bfff8d77";

const MOCK_PLANS = [
  {
    id: "rc_free",
    name: "Free",
    price: "0",
    description: "Perfect for exploring the platform",
    features: ["Community Forum Access", "Basic AI Chat (5/day)", "Public Analytics", "Standard Support"],
    buttonText: "Current Plan",
    highlight: false,
  },
  {
    id: "rc_standard",
    name: "Standard",
    price: "29",
    description: "Best for active developers",
    features: ["Priority Forum Support", "Pro AI Engine (Gemini)", "Personal Analytics", "API Access"],
    buttonText: "Upgrade to Standard",
    highlight: true,
  },
  {
    id: "rc_premium",
    name: "Premium",
    price: "99",
    description: "For security professionals",
    features: ["Private Security Hub", "Claude 3 & Llama 3 AI", "Advanced Threat Intel", "Unlimited API Calls"],
    buttonText: "Go Premium",
    highlight: false,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    description: "Custom solutions for teams",
    features: ["SLA Guarantees", "Dedicated AI Instance", "White-label Options", "24/7 Phone Support"],
    buttonText: "Contact Sales",
    highlight: false,
  }
];

export default function SubscriptionPage() {
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<string>("Free");
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  // 1. Initialize WebSockets for real-time subscription sync
  useEffect(() => {
    if (!user?.id) return;

    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const socket: Socket = io(socketUrl, {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      setIsSocketConnected(true);
      socket.emit('subscribeToUserEvents', user.id);
    });

    socket.on('subscriptionUpdated', (data: { newRank: string }) => {
      console.log("⚡ Real-time ping received! Rank updated to: ", data.newRank);
      setCurrentPlan(data.newRank);
      setIsUpgrading(false);
    });

    socket.on('disconnect', () => setIsSocketConnected(false));

    return () => {
      socket.disconnect();
    };
  }, [user]);

  // 2. Initialize RevenueCat and fetch initial status
  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;
    const setupRC = async () => {
      try {
        if (!Purchases.isConfigured()) {
          Purchases.configure(RC_WEB_API_KEY, user.id);
        }
        const instance = Purchases.getSharedInstance();
        const customerInfo = await instance.getCustomerInfo();
        if (isMounted && customerInfo.entitlements.active['pro']) {
          setCurrentPlan("Standard");
        }
      } catch (e) {
        console.error("RevenueCat Init error:", e);
      }
    };
    setupRC();

    return () => { isMounted = false; };
  }, [user]);

  // 3. Handle Checkout via RevenueCat Web SDK
  const handleUpgrade = async (planId: string, planName: string) => {
    if (planId === "enterprise") {
      window.location.href = "/enterprise-contact";
      return;
    }

    if (planName === currentPlan) return;

    if (!user?.id) {
      alert("Please log in to upgrade.");
      return;
    }

    try {
      setIsUpgrading(true);
      const instance = Purchases.getSharedInstance();
      const offerings = await instance.getOfferings();
      const pkg = offerings.current?.availablePackages.find(
        (p: Package) => p.rcBillingProduct.identifier === planId
      );
      if (!pkg) throw new Error(`Package ${planId} not found in offerings.`);

      const { customerInfo } = await instance.purchasePackage(pkg);

      if (customerInfo.entitlements.active['pro']) {
        setCurrentPlan(planName);
        setIsUpgrading(false);
      }
    } catch (e: unknown) {
      const err = e as { userCancelled?: boolean };
      if (!err.userCancelled) {
        alert("Error during checkout. Please try again.");
      }
      setIsUpgrading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-16 space-y-4">
        {/* Connection Indicator */}
        <div className="fixed top-24 right-8 flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">
          {isSocketConnected ? (
            <><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.7)]" /> Live Sync On</>
          ) : (
            <><div className="w-2 h-2 rounded-full bg-slate-500" /> Offline</>
          )}
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
          Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Subscription</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Manage your plan and scale your development and security capabilities.
        </p>
      </div>

      {!user?.id && (
        <div className="mb-12 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-center">
          <p className="text-blue-400 text-sm font-medium">
            You are viewing plans as a guest. Please <a href="/auth" className="underline font-bold">log in</a> to upgrade your account.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {MOCK_PLANS.map((plan) => {
          const isCurrentPlan = plan.name.toLowerCase() === currentPlan.toLowerCase();

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
              {isCurrentPlan && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              )}

              {plan.highlight && !isCurrentPlan && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Most Popular
                </div>
              )}

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
                  <span className="text-4xl font-extrabold text-white">${plan.price}</span>
                  {plan.id !== "enterprise" && <span className="text-slate-500 font-medium">/mo</span>}
                </div>
                <p className="text-slate-400 text-sm mt-4 leading-relaxed">
                  {plan.description}
                </p>
              </div>

              <div className="flex-1 space-y-4 mb-8 relative z-10">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={cn(
                      "mt-1 p-0.5 rounded-full border",
                      isCurrentPlan ? "bg-indigo-500/10 border-indigo-500/30" : "bg-emerald-500/10 border-emerald-500/20"
                    )}>
                      <Check className={cn("w-3 h-3", isCurrentPlan ? "text-indigo-400" : "text-emerald-400")} />
                    </div>
                    <span className="text-sm text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleUpgrade(plan.id, plan.name)}
                disabled={isCurrentPlan || isUpgrading}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-2 relative z-10",
                  isCurrentPlan
                    ? "bg-white/5 text-slate-400 cursor-not-allowed border border-white/5"
                    : plan.highlight
                      ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-xl shadow-purple-500/20 hover:opacity-90 active:scale-95"
                      : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10 active:scale-95"
                )}
              >
                {isUpgrading && plan.highlight ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isCurrentPlan ? (
                  "Current Plan"
                ) : (
                  plan.buttonText
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
