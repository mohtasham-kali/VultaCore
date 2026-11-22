"use client";

import { useEntitlements } from "./useEntitlements";

const FEATURE_TO_REQUIRED_PLAN: Record<string, string> = {
  community_forum: "Free",
  standard_support: "Free",
  basic_ai_chat: "Free",
  public_analytics: "Free",
  priority_forum_support: "Standard",
  gemini_pro: "Standard",
  personal_analytics: "Standard",
  api_access: "Standard",
  private_security_hub: "Premium",
  advanced_threat_intel: "Premium",
  claude_ai: "Premium",
  llama_ai: "Premium",
  unlimited_api: "Premium",
  sla_guarantees: "Enterprise",
  dedicated_ai_instance: "Enterprise",
  white_label: "Enterprise",
  phone_support_24_7: "Enterprise",
};

export function useFeatureAccess(featureKey: string) {
  const { features, plan, isLoading } = useEntitlements();
  const feat = features[featureKey];

  const hasAccess = Boolean(feat && feat.enabled);
  const limit = feat?.limit ?? null;
  const remaining = feat?.remainingToday ?? 0;
  const used = feat?.usedToday ?? 0;
  const requiredPlan = FEATURE_TO_REQUIRED_PLAN[featureKey] || "Premium";

  return {
    hasAccess,
    limit,
    remaining,
    used,
    currentPlan: plan.name,
    requiredPlan,
    isLoading,
    featureName: feat?.name || featureKey,
  };
}

