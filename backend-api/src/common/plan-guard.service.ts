import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { EntitlementsService } from '../plans/entitlements.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class PlanGuardService {
  constructor(
    @Inject(forwardRef(() => EntitlementsService))
    private readonly entitlementsService: EntitlementsService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

  /**
   * Checks if a user has reached their daily AI chat limit.
   */
  async checkAiChatLimit(userId: string): Promise<{
    allowed: boolean;
    remaining: number | 'unlimited';
    limit: number | 'unlimited';
    tier: string;
  }> {
    const entitlements = await this.entitlementsService.getUserEntitlements(userId);
    const basicAi = entitlements.features['basic_ai_chat'];

    const allowed = entitlements.usage.aiChatsRemaining === 'unlimited' || entitlements.usage.aiChatsRemaining > 0;

    return {
      allowed,
      remaining: entitlements.usage.aiChatsRemaining,
      limit: entitlements.usage.aiChatsLimit,
      tier: entitlements.plan.name,
    };
  }

  /**
   * Atomically increments AI chat usage for the day.
   */
  async incrementAiUsage(userId: string): Promise<void> {
    await this.entitlementsService.consumeUsage(userId, 'basic_ai_chat', 1);
  }

  /**
   * Checks if a user has reached their daily Security Hub limit.
   */
  async checkSecurityHubLimit(userId: string): Promise<{
    allowed: boolean;
    remaining: number | 'unlimited';
    limit: number | 'unlimited';
    tier: string;
  }> {
    const entitlements = await this.entitlementsService.getUserEntitlements(userId);
    const secHub = entitlements.features['private_security_hub'];

    if (!secHub || !secHub.enabled) {
      return { allowed: false, remaining: 0, limit: 0, tier: entitlements.plan.name };
    }

    return {
      allowed: secHub.remainingToday === 'unlimited' || secHub.remainingToday > 0,
      remaining: secHub.remainingToday,
      limit: secHub.limit === null ? 'unlimited' : secHub.limit,
      tier: entitlements.plan.name,
    };
  }

  async incrementSecurityHubUsage(userId: string): Promise<void> {
    await this.entitlementsService.consumeUsage(userId, 'private_security_hub', 1);
  }

  /**
   * Returns the allowed AI models for a user's dynamic subscription.
   */
  async getAllowedModels(userId: string): Promise<string[]> {
    const entitlements = await this.entitlementsService.getUserEntitlements(userId);
    return entitlements.allowedModels;
  }

  /**
   * Checks if a user can access API endpoints.
   */
  async canUseApi(userId: string): Promise<boolean> {
    return this.entitlementsService.hasEntitlement(userId, 'api_access');
  }

  /**
   * Checks if a user can access the Security Hub.
   */
  async canAccessSecurityHub(userId: string): Promise<boolean> {
    return this.entitlementsService.hasEntitlement(userId, 'private_security_hub');
  }

  /**
   * Returns full plan info for a user (backward compatible for /api/users/:id/plan-info).
   */
  async getPlanInfo(userId: string) {
    const entitlements = await this.entitlementsService.getUserEntitlements(userId);
    return {
      tier: entitlements.plan.name,
      plan: entitlements.plan,
      features: entitlements.features,
      limits: {
        aiModels: entitlements.allowedModels,
        aiChatsPerDay: entitlements.usage.aiChatsLimit,
      },
      usage: entitlements.usage,
    };
  }
}
