"use client";

import Link from "next/link";
import { Lock, Sparkles, ArrowRight, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface UpgradeRequiredProps {
  feature?: string;
  featureName?: string;
  planName?: string;
  className?: string;
  description?: string;
}

export function UpgradeRequired({
  feature,
  featureName,
  planName = "Premium",
  className,
  description,
}: UpgradeRequiredProps) {
  const displayTitle = featureName || (feature ? feature.replace(/_/g, " ").toUpperCase() : "Premium Feature");

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-b from-purple-950/40 via-slate-900/90 to-slate-950 p-8 text-center backdrop-blur-xl shadow-2xl",
        className,
      )}
    >
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-lg mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-5 shadow-lg shadow-purple-500/10">
          <Lock className="w-7 h-7" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" /> Requires {planName} Plan
        </div>

        <h3 className="text-2xl font-bold text-white tracking-tight mb-2">
          Unlock {displayTitle}
        </h3>

        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          {description ||
            `This capability is restricted to ${planName} subscribers. Upgrade your account today to unlock full access, deep analytics, and unlimited reasoning tools.`}
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
          <Link
            href="/subscription"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold text-sm shadow-xl shadow-purple-500/25 hover:brightness-110 active:scale-95 transition-all"
          >
            <span>Upgrade to {planName}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/pricing"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-sm font-semibold transition-all"
          >
            Compare Plans
          </Link>
        </div>
      </div>
    </div>
  );
}

