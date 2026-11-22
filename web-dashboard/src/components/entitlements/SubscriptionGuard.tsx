"use client";

import React from "react";
import { useEntitlements } from "@/hooks/useEntitlements";
import { UpgradeRequired } from "./UpgradeRequired";

interface SubscriptionGuardProps {
  requiredPlan: "Standard" | "Premium" | "Enterprise";
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

const PLAN_RANKS: Record<string, number> = {
  free: 0,
  standard: 1,
  premium: 2,
  enterprise: 3,
};

export function SubscriptionGuard({
  requiredPlan,
  fallback,
  children,
}: SubscriptionGuardProps) {
  const { plan, isLoading } = useEntitlements();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentRank = PLAN_RANKS[plan.name.toLowerCase()] ?? 0;
  const targetRank = PLAN_RANKS[requiredPlan.toLowerCase()] ?? 1;

  if (currentRank >= targetRank) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return <UpgradeRequired planName={requiredPlan} />;
}

