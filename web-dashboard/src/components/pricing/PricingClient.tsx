"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ShieldCheck, Zap, Sparkles, Loader2 } from "lucide-react";
import { initializePaddle, type Paddle, type Environments } from "@paddle/paddle-js";
import { useAuth } from "@/context/AuthContext";
import { PricingTiers, type Tier } from "@/constants/pricing-tier";
import { usePaddlePrices } from "@/hooks/usePaddlePrices";

interface PricingClientProps {
  initialCountry?: string | null;
}

export function PricingClient({ initialCountry }: PricingClientProps) {
  const { user } = useAuth();
  const [frequency, setFrequency] = useState<"month" | "year">("month");
  const [paddle, setPaddle] = useState<Paddle | undefined>();
  const [paddleInitError, setPaddleInitError] = useState<string | null>(null);

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

  const handleSubscribe = (tier: Tier) => {
    if (!paddle) {
      console.error("Paddle is not initialized yet.");
      return;
    }

    const priceId = tier.priceId[frequency];
    const successUrl = `${window.location.origin}/welcome`;

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

          return (
            <div
              key={tier.name}
              className={`relative flex flex-col p-8 rounded-2xl bg-white/5 border ${
                tier.highlight
                  ? "border-purple-500/60 shadow-2xl shadow-purple-500/10"
                  : "border-white/10"
              } transition-all duration-300 hover:-translate-y-1`}
            >
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-bold rounded-full uppercase tracking-wider">
                  {tier.badge}
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                <p className="text-slate-400 text-sm min-h-[40px]">{tier.description}</p>
              </div>

              {/* Price Display — strictly Paddle's formattedTotals */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  {pricesLoading || !formattedPrice ? (
                    <span className="text-3xl font-extrabold text-slate-500 animate-pulse">...</span>
                  ) : (
                    <span className="text-4xl font-extrabold text-white tracking-tight">
                      {formattedPrice}
                    </span>
                  )}
                  <span className="text-slate-400 text-sm ml-1.5">
                    / {frequency === "month" ? "month" : "year"}
                  </span>
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

              {/* Subscribe CTA Button — Opens Paddle Overlay Checkout */}
              <button
                type="button"
                onClick={() => handleSubscribe(tier)}
                disabled={!paddle || pricesLoading}
                className={`w-full py-3.5 px-4 rounded-xl font-semibold text-center text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  tier.highlight
                    ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:brightness-110 shadow-lg shadow-purple-500/25 active:scale-[0.98]"
                    : "bg-white/10 text-white hover:bg-white/20 border border-white/10 active:scale-[0.98]"
                } ${!paddle || pricesLoading ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                {!paddle && pricesLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-purple-300" />
                    <span>Subscribe to {tier.name}</span>
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

