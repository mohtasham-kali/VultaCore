export type PlanTier = 'Free' | 'Standard' | 'Premium' | 'Enterprise';
export interface PlanLimits {
    tier: PlanTier;
    aiChatsPerDay: number | 'unlimited';
    aiModels: string[];
    analyticsAccess: 'public' | 'personal' | 'advanced';
    apiAccess: boolean;
    forumPriority: boolean;
    securityHubScansPerDay: number | 'unlimited';
    botTypes: ('general' | 'cyber' | 'all')[];
    maxBotsPerDay: number | 'unlimited';
    supportLevel: 'standard' | 'priority' | 'dedicated';
    whiteLabel: boolean;
}
export declare const PLAN_LIMITS: Record<string, PlanLimits>;
export declare function resolvePlanTier(rank: string): PlanLimits;
export declare function canAccessFeature(rank: string, feature: keyof PlanLimits): boolean;
