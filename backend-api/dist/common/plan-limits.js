"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLAN_LIMITS = void 0;
exports.resolvePlanTier = resolvePlanTier;
exports.canAccessFeature = canAccessFeature;
exports.PLAN_LIMITS = {
    Free: {
        tier: 'Free',
        aiChatsPerDay: 5,
        aiModels: ['llama-3.1-8b-instant'],
        analyticsAccess: 'public',
        apiAccess: false,
        forumPriority: false,
        securityHubScansPerDay: 10,
        botTypes: ['general', 'cyber'],
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
        securityHubScansPerDay: 20,
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
        securityHubScansPerDay: 'unlimited',
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
        securityHubScansPerDay: 'unlimited',
        botTypes: ['general', 'cyber', 'all'],
        maxBotsPerDay: 'unlimited',
        supportLevel: 'dedicated',
        whiteLabel: true,
    },
};
function resolvePlanTier(rank) {
    if (!rank || rank.startsWith('Level') || rank === 'Free') {
        return exports.PLAN_LIMITS['Free'];
    }
    return exports.PLAN_LIMITS[rank] ?? exports.PLAN_LIMITS['Free'];
}
function canAccessFeature(rank, feature) {
    const plan = resolvePlanTier(rank);
    const value = plan[feature];
    if (typeof value === 'boolean')
        return value;
    if (typeof value === 'number')
        return value > 0;
    if (value === 'unlimited')
        return true;
    return true;
}
//# sourceMappingURL=plan-limits.js.map