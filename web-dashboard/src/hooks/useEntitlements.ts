"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL, SOCKET_URL } from "@/lib/constants";
import { io, Socket } from "socket.io-client";

export interface FeatureEntitlement {
  key: string;
  name: string;
  enabled: boolean;
  limit: number | null; // null = unlimited
  usedToday: number;
  remainingToday: number | 'unlimited';
  config?: any;
}

export interface EntitlementsData {
  userId: string;
  plan: {
    id?: string | null;
    name: string;
    slug: string;
    status: string;
    billingInterval: string;
    currentPeriodEnd: string | null;
    isEnterpriseCustom: boolean;
  };
  features: Record<string, FeatureEntitlement>;
  allowedModels: string[];
  usage: {
    aiChatsToday: number;
    aiChatsLimit: number | 'unlimited';
    aiChatsRemaining: number | 'unlimited';
  };
}

const DEFAULT_FREE_ENTITLEMENTS: EntitlementsData = {
  userId: "",
  plan: {
    name: "Free",
    slug: "free",
    status: "active",
    billingInterval: "month",
    currentPeriodEnd: null,
    isEnterpriseCustom: false,
  },
  features: {
    community_forum: { key: "community_forum", name: "Community Forum Access", enabled: true, limit: null, usedToday: 0, remainingToday: "unlimited" },
    standard_support: { key: "standard_support", name: "Standard Support", enabled: true, limit: null, usedToday: 0, remainingToday: "unlimited" },
    basic_ai_chat: { key: "basic_ai_chat", name: "Basic AI Chat", enabled: true, limit: 5, usedToday: 0, remainingToday: 5 },
    public_analytics: { key: "public_analytics", name: "Public Analytics", enabled: true, limit: null, usedToday: 0, remainingToday: "unlimited" },
    priority_forum_support: { key: "priority_forum_support", name: "Priority Forum Support", enabled: false, limit: null, usedToday: 0, remainingToday: 0 },
    gemini_pro: { key: "gemini_pro", name: "Pro AI Engine (Gemini)", enabled: false, limit: null, usedToday: 0, remainingToday: 0 },
    personal_analytics: { key: "personal_analytics", name: "Personal Analytics", enabled: false, limit: null, usedToday: 0, remainingToday: 0 },
    api_access: { key: "api_access", name: "API Access", enabled: false, limit: null, usedToday: 0, remainingToday: 0 },
    private_security_hub: { key: "private_security_hub", name: "Private Security Hub", enabled: false, limit: null, usedToday: 0, remainingToday: 0 },
    advanced_threat_intel: { key: "advanced_threat_intel", name: "Advanced Threat Intelligence", enabled: false, limit: null, usedToday: 0, remainingToday: 0 },
    claude_ai: { key: "claude_ai", name: "Claude 3 AI", enabled: false, limit: null, usedToday: 0, remainingToday: 0 },
    llama_ai: { key: "llama_ai", name: "Llama 3 AI", enabled: false, limit: null, usedToday: 0, remainingToday: 0 },
    unlimited_api: { key: "unlimited_api", name: "Unlimited API Calls", enabled: false, limit: null, usedToday: 0, remainingToday: 0 },
    sla_guarantees: { key: "sla_guarantees", name: "SLA Guarantees", enabled: false, limit: null, usedToday: 0, remainingToday: 0 },
    dedicated_ai_instance: { key: "dedicated_ai_instance", name: "Dedicated AI Instance", enabled: false, limit: null, usedToday: 0, remainingToday: 0 },
    white_label: { key: "white_label", name: "White-label Options", enabled: false, limit: null, usedToday: 0, remainingToday: 0 },
    phone_support_24_7: { key: "phone_support_24_7", name: "24/7 Phone Support", enabled: false, limit: null, usedToday: 0, remainingToday: 0 },
  },
  allowedModels: ["llama-3.1-8b-instant"],
  usage: {
    aiChatsToday: 0,
    aiChatsLimit: 5,
    aiChatsRemaining: 5,
  },
};

export function useEntitlements() {
  const { user, session } = useAuth();
  const [data, setData] = useState<EntitlementsData>(DEFAULT_FREE_ENTITLEMENTS);
  const [loading, setLoading] = useState(true);

  const fetchEntitlements = useCallback(async () => {
    if (!user?.id) {
      setData(DEFAULT_FREE_ENTITLEMENTS);
      setLoading(false);
      return;
    }

    try {
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`${API_BASE_URL}/users/${user.id}/entitlements`, { headers });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.warn("Failed to fetch entitlements, using cached/fallback:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, session?.access_token]);

  useEffect(() => {
    fetchEntitlements();
  }, [fetchEntitlements]);

  // Real-time synchronization when subscription updates
  useEffect(() => {
    if (!user?.id) return;
    const socket: Socket = io(SOCKET_URL, { transports: ["websocket"] });

    socket.on("connect", () => {
      socket.emit("subscribeToUserEvents", user.id);
    });

    socket.on("subscriptionUpdated", () => {
      fetchEntitlements();
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id, fetchEntitlements]);

  const hasFeature = useCallback(
    (featureKey: string): boolean => {
      const feat = data.features[featureKey];
      return Boolean(feat && feat.enabled);
    },
    [data.features],
  );

  const checkLimit = useCallback(
    (featureKey: string) => {
      const feat = data.features[featureKey];
      if (!feat || !feat.enabled) {
        return { allowed: false, remaining: 0, limit: 0 };
      }
      if (feat.limit === null) {
        return { allowed: true, remaining: "unlimited" as const, limit: "unlimited" as const };
      }
      const remaining = typeof feat.remainingToday === "number" ? feat.remainingToday : 0;
      return {
        allowed: remaining > 0,
        remaining,
        limit: feat.limit,
      };
    },
    [data.features],
  );

  return {
    entitlements: data,
    plan: data.plan,
    features: data.features,
    allowedModels: data.allowedModels,
    usage: data.usage,
    hasFeature,
    checkLimit,
    isLoading: loading,
    refresh: fetchEntitlements,
  };
}

