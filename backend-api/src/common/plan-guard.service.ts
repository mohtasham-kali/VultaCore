import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { resolvePlanTier } from './plan-limits';
import { UsersService } from '../users/users.service';

// Simple in-memory daily usage tracker (resets each day)
// For production scale, replace with Redis
interface UsageEntry {
  count: number;
  date: string; // YYYY-MM-DD
}

@Injectable()
export class PlanGuardService {
  private aiUsage = new Map<string, UsageEntry>();
  private securityHubUsage = new Map<string, UsageEntry>();

  constructor(private readonly usersService: UsersService) {}

  private todayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Checks if a user has reached their daily AI chat limit.
   * Returns { allowed: boolean, remaining: number | 'unlimited', limit: number | 'unlimited' }
   */
  async checkAiChatLimit(userId: string): Promise<{
    allowed: boolean;
    remaining: number | 'unlimited';
    limit: number | 'unlimited';
    tier: string;
  }> {
    const user = await this.usersService.findOne(userId);
    const rank = user?.rank ?? 'Free';
    const plan = resolvePlanTier(rank);
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

    // Reset if it's a new day
    if (!existing || existing.date !== today) {
      this.aiUsage.set(userId, { count: 0, date: today });
    }

    const entry = this.aiUsage.get(userId)!;
    const remaining = Math.max(0, limit - entry.count);

    return {
      allowed: entry.count < limit,
      remaining,
      limit,
      tier: rank,
    };
  }

  /**
   * Increments AI chat usage for the day.
   */
  incrementAiUsage(userId: string): void {
    const today = this.todayDate();
    const existing = this.aiUsage.get(userId);

    if (!existing || existing.date !== today) {
      this.aiUsage.set(userId, { count: 1, date: today });
    } else {
      existing.count += 1;
    }
  }

  /**
   * Checks if a user has reached their daily Security Hub scan limit.
   */
  async checkSecurityHubLimit(userId: string): Promise<{
    allowed: boolean;
    remaining: number | 'unlimited';
    limit: number | 'unlimited';
    tier: string;
  }> {
    const user = await this.usersService.findOne(userId);
    const rank = user?.rank ?? 'Free';
    const plan = resolvePlanTier(rank);
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

    const entry = this.securityHubUsage.get(userId)!;
    const remaining = Math.max(0, limit - entry.count);

    return { allowed: entry.count < limit, remaining, limit, tier: rank };
  }

  incrementSecurityHubUsage(userId: string): void {
    const today = this.todayDate();
    const existing = this.securityHubUsage.get(userId);
    if (!existing || existing.date !== today) {
      this.securityHubUsage.set(userId, { count: 1, date: today });
    } else {
      existing.count += 1;
    }
  }

  /**
   * Returns the allowed AI models for a user's plan.
   */
  async getAllowedModels(userId: string): Promise<string[]> {
    const user = await this.usersService.findOne(userId);
    const plan = resolvePlanTier(user?.rank ?? 'Free');
    return plan.aiModels;
  }

  /**
   * Checks if a user can access API endpoints (Standard+ only).
   */
  async canUseApi(userId: string): Promise<boolean> {
    const user = await this.usersService.findOne(userId);
    const plan = resolvePlanTier(user?.rank ?? 'Free');
    return plan.apiAccess;
  }

  /**
   * Checks if a user can access the Security Hub (all plans, limited by quota).
   */
  async canAccessSecurityHub(userId: string): Promise<boolean> {
    const user = await this.usersService.findOne(userId);
    const plan = resolvePlanTier(user?.rank ?? 'Free');
    return (
      plan.securityHubScansPerDay === 'unlimited' ||
      plan.securityHubScansPerDay > 0
    );
  }

  /**
   * Returns full plan info for a user (used by frontend /api/users/:id/plan-info).
   */
  async getPlanInfo(userId: string) {
    const user = await this.usersService.findOne(userId);
    const rank = user?.rank ?? 'Free';
    const plan = resolvePlanTier(rank);
    const usage = this.aiUsage.get(userId);
    const today = this.todayDate();
    const usedToday = usage?.date === today ? usage.count : 0;

    return {
      tier: rank,
      limits: plan,
      usage: {
        aiChatsToday: usedToday,
        aiChatsLimit: plan.aiChatsPerDay,
        aiChatsRemaining:
          plan.aiChatsPerDay === 'unlimited'
            ? 'unlimited'
            : Math.max(0, plan.aiChatsPerDay - usedToday),
      },
    };
  }
}
