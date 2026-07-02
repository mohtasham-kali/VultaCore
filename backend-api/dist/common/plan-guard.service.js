"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanGuardService = void 0;
const common_1 = require("@nestjs/common");
const plan_limits_1 = require("./plan-limits");
const users_service_1 = require("../users/users.service");
let PlanGuardService = class PlanGuardService {
    usersService;
    aiUsage = new Map();
    securityHubUsage = new Map();
    constructor(usersService) {
        this.usersService = usersService;
    }
    todayDate() {
        return new Date().toISOString().split('T')[0];
    }
    async checkAiChatLimit(userId) {
        const user = await this.usersService.findOne(userId);
        const rank = user?.rank ?? 'Free';
        const plan = (0, plan_limits_1.resolvePlanTier)(rank);
        const limit = plan.aiChatsPerDay;
        if (limit === 'unlimited') {
            return {
                allowed: true,
                remaining: 'unlimited',
                limit: 'unlimited',
                tier: rank,
            };
        }
        const today = this.todayDate();
        const existing = this.aiUsage.get(userId);
        if (!existing || existing.date !== today) {
            this.aiUsage.set(userId, { count: 0, date: today });
        }
        const entry = this.aiUsage.get(userId);
        const remaining = Math.max(0, limit - entry.count);
        return {
            allowed: entry.count < limit,
            remaining,
            limit,
            tier: rank,
        };
    }
    incrementAiUsage(userId) {
        const today = this.todayDate();
        const existing = this.aiUsage.get(userId);
        if (!existing || existing.date !== today) {
            this.aiUsage.set(userId, { count: 1, date: today });
        }
        else {
            existing.count += 1;
        }
    }
    async checkSecurityHubLimit(userId) {
        const user = await this.usersService.findOne(userId);
        const rank = user?.rank ?? 'Free';
        const plan = (0, plan_limits_1.resolvePlanTier)(rank);
        const limit = plan.securityHubScansPerDay;
        if (limit === 'unlimited') {
            return {
                allowed: true,
                remaining: 'unlimited',
                limit: 'unlimited',
                tier: rank,
            };
        }
        const today = this.todayDate();
        const existing = this.securityHubUsage.get(userId);
        if (!existing || existing.date !== today) {
            this.securityHubUsage.set(userId, { count: 0, date: today });
        }
        const entry = this.securityHubUsage.get(userId);
        const remaining = Math.max(0, limit - entry.count);
        return { allowed: entry.count < limit, remaining, limit, tier: rank };
    }
    incrementSecurityHubUsage(userId) {
        const today = this.todayDate();
        const existing = this.securityHubUsage.get(userId);
        if (!existing || existing.date !== today) {
            this.securityHubUsage.set(userId, { count: 1, date: today });
        }
        else {
            existing.count += 1;
        }
    }
    async getAllowedModels(userId) {
        const user = await this.usersService.findOne(userId);
        const plan = (0, plan_limits_1.resolvePlanTier)(user?.rank ?? 'Free');
        return plan.aiModels;
    }
    async canUseApi(userId) {
        const user = await this.usersService.findOne(userId);
        const plan = (0, plan_limits_1.resolvePlanTier)(user?.rank ?? 'Free');
        return plan.apiAccess;
    }
    async canAccessSecurityHub(userId) {
        const user = await this.usersService.findOne(userId);
        const plan = (0, plan_limits_1.resolvePlanTier)(user?.rank ?? 'Free');
        return (plan.securityHubScansPerDay === 'unlimited' ||
            plan.securityHubScansPerDay > 0);
    }
    async getPlanInfo(userId) {
        const user = await this.usersService.findOne(userId);
        const rank = user?.rank ?? 'Free';
        const plan = (0, plan_limits_1.resolvePlanTier)(rank);
        const usage = this.aiUsage.get(userId);
        const today = this.todayDate();
        const usedToday = usage?.date === today ? usage.count : 0;
        return {
            tier: rank,
            limits: plan,
            usage: {
                aiChatsToday: usedToday,
                aiChatsLimit: plan.aiChatsPerDay,
                aiChatsRemaining: plan.aiChatsPerDay === 'unlimited'
                    ? 'unlimited'
                    : Math.max(0, plan.aiChatsPerDay - usedToday),
            },
        };
    }
};
exports.PlanGuardService = PlanGuardService;
exports.PlanGuardService = PlanGuardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], PlanGuardService);
//# sourceMappingURL=plan-guard.service.js.map