/**
 * Central Plan Enforcement for VultaCore
 * ----------------------------------------
 * Defines what each plan tier can and cannot access.
 * Used by guards and services to enforce limits.
 */

export type PlanTier = 'Free' | 'Standard' | 'Premium' | 'Enterprise';

export interface PlanLimits {
  tier: PlanTier;
  aiChatsPerDay: number | 'unlimited';
  aiModels: string[];
  analyticsAccess: 'public' | 'personal' | 'advanced';
  apiAccess: boolean;
  forumPriority: boolean;
  securityHub: boolean;
  botTypes: ('general' | 'cyber' | 'all')[];
  maxBotsPerDay: number | 'unlimited';
  supportLevel: 'standard' | 'priority' | 'dedicated';
  whiteLabel: boolean;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  // Covers "Level 1", "Free", undefined
  Free: {
    tier: 'Free',
    aiChatsPerDay: 5,
    aiModels: ['llama-3.1-8b-instant'],
    analyticsAccess: 'public',
    apiAccess: false,
    forumPriority: false,
    securityHub: false,
    botTypes: ['general'],
    maxBotsPerDay: 10,
    supportLevel: 'standard',
    whiteLabel: false,
  },
  Standard: {
    tier: 'Standard',
    aiChatsPerDay: 100,
    aiModels: ['gemini-1.5-pro', 'llama-3.1-8b-instant'],
    analyticsAccess: 'personal',
    apiAccess: true,
    forumPriority: true,
    securityHub: false,
    botTypes: ['general', 'cyber'],
    maxBotsPerDay: 100,
    supportLevel: 'priority',
    whiteLabel: false,
  },
  Premium: {
    tier: 'Premium',
    aiChatsPerDay: 'unlimited',
    aiModels: ['claude-3-5-sonnet-20241022', 'llama-3.3-70b-versatile', 'gemini-1.5-pro'],
    analyticsAccess: 'advanced',
    apiAccess: true,
    forumPriority: true,
    securityHub: true,
    botTypes: ['general', 'cyber', 'all'],
    maxBotsPerDay: 'unlimited',
    supportLevel: 'priority',
    whiteLabel: false,
  },
  Enterprise: {
    tier: 'Enterprise',
    aiChatsPerDay: 'unlimited',
    aiModels: ['claude-3-5-sonnet-20241022', 'llama-3.3-70b-versatile', 'gemini-1.5-pro'],
    analyticsAccess: 'advanced',
    apiAccess: true,
    forumPriority: true,
    securityHub: true,
    botTypes: ['general', 'cyber', 'all'],
    maxBotsPerDay: 'unlimited',
    supportLevel: 'dedicated',
    whiteLabel: true,
  },
};

/**
 * Resolves user rank string (including legacy "Level X" format) to a plan tier.
 */
export function resolvePlanTier(rank: string): PlanLimits {
  if (!rank || rank.startsWith('Level') || rank === 'Free') {
    return PLAN_LIMITS['Free'];
  }
  return PLAN_LIMITS[rank] ?? PLAN_LIMITS['Free'];
}

/**
 * Checks if a user's plan allows access to a feature.
 */
export function canAccessFeature(
  rank: string,
  feature: keyof PlanLimits,
): boolean {
  const plan = resolvePlanTier(rank);
  const value = plan[feature];
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  if (value === 'unlimited') return true;
  return true;
}
