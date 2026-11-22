"use client";

import React from "react";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { UpgradeRequired } from "./UpgradeRequired";

interface FeatureGateProps {
  feature: string;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
  children: React.ReactNode;
}

/**
 * Conditionally renders children if the authenticated user has access to the specified feature.
 * Otherwise, renders fallback or a professional UpgradeRequired card.
 */
export function FeatureGate({
  feature,
  fallback,
  showUpgradePrompt = true,
  children,
}: FeatureGateProps) {
  const { hasAccess, isLoading, requiredPlan, featureName } = useFeatureAccess(feature);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showUpgradePrompt) {
    return <UpgradeRequired feature={feature} featureName={featureName} planName={requiredPlan} />;
  }

  return null;
}

