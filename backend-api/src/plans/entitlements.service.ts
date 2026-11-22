import { Injectable, Logger, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSubscription } from './entities/user-subscription.entity';
import { Plan } from './entities/plan.entity';
import { Feature } from './entities/feature.entity';
import { PlanFeature } from './entities/plan-feature.entity';
import { FeatureUsage } from './entities/feature-usage.entity';
import { PlansService } from './plans.service';

export interface UserEntitlementsResponse {
  userId: string;
  plan: {
    id?: string | null;
    name: string;
    slug: string;
    status: string;
    billingInterval: string;
    currentPeriodEnd: Date | null;
    isEnterpriseCustom: boolean;
  };
  features: Record<
    string,
    {
      key: string;
      name: string;
      enabled: boolean;
      limit: number | null; // null = unlimited
      usedToday: number;
      remainingToday: number | 'unlimited';
      config?: any;
    }
  >;
  allowedModels: string[];
  usage: {
    aiChatsToday: number;
    aiChatsLimit: number | 'unlimited';
    aiChatsRemaining: number | 'unlimited';
  };
}

@Injectable()
export class EntitlementsService {
  private readonly logger = new Logger(EntitlementsService.name);

  constructor(
    @InjectRepository(UserSubscription)
    private readonly subRepo: Repository<UserSubscription>,
    @InjectRepository(Plan)
    private readonly planRepo: Repository<Plan>,
    @InjectRepository(Feature)
    private readonly featureRepo: Repository<Feature>,
    @InjectRepository(PlanFeature)
    private readonly planFeatureRepo: Repository<PlanFeature>,
    @InjectRepository(FeatureUsage)
    private readonly usageRepo: Repository<FeatureUsage>,
    @Inject(forwardRef(() => PlansService))
    private readonly plansService: PlansService,
  ) {}

  private getTodayPeriod(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Checks if user has administrator privileges for complete server-side bypass.
   */
  async isAdminUser(userId: string): Promise<boolean> {
    try {
      const rows = await this.subRepo.manager.query(
        `SELECT email, role, "isAdmin" FROM "user" WHERE id = $1 UNION SELECT email, role, false as "isAdmin" FROM profiles WHERE id = $1 LIMIT 1`,
        [userId],
      );
      if (rows && rows.length > 0) {
        const u = rows[0];
        const email = (u.email || '').toLowerCase().trim();
        const adminEmail = (process.env.ADMIN_EMAIL || 'mohtasham.siddiqui17@gmail.com').toLowerCase().trim();
        return u.isAdmin === true || u.role === 'admin' || email === adminEmail;
      }
    } catch (err) {
      this.logger.warn(`Could not verify admin status for ${userId}: ${err}`);
    }
    return false;
  }

  /**
   * Resolves or auto-creates an active subscription for a user.
   */
  async getOrCreateSubscription(userId: string, fallbackRank?: string): Promise<UserSubscription> {
    // 1. Resolve user's authoritative tier from user or profiles table if not explicitly passed
    let activeRank = fallbackRank;
    if (!activeRank) {
      try {
        const rows = await this.subRepo.manager.query(
          `SELECT rank FROM "user" WHERE id = $1 UNION SELECT INITCAP(plan) as rank FROM profiles WHERE id = $1 LIMIT 1`,
          [userId],
        );
        if (rows && rows[0]?.rank) {
          activeRank = rows[0].rank;
        }
      } catch (err) {
        this.logger.warn(`Could not check user/profiles table for rank: ${err}`);
      }
    }

    const targetRank = activeRank || 'Free';
    const plan = await this.planRepo.findOne({
      where: [{ name: targetRank }, { slug: targetRank.toLowerCase() }],
    });

    let sub = await this.subRepo.findOne({
      where: { userId },
      relations: ['plan'],
      order: { createdAt: 'DESC' },
    });

    if (!sub) {
      sub = this.subRepo.create({
        userId,
        plan: plan || undefined,
        planId: plan?.id,
        planName: plan?.name || targetRank,
        status: 'active',
        billingInterval: 'month',
        isEnterpriseCustom: targetRank.toLowerCase() === 'enterprise',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      sub = await this.subRepo.save(sub);
      this.logger.log(`Created default ${sub.planName} subscription for user ${userId}`);
    } else if (plan && sub.planName.toLowerCase() !== plan.name.toLowerCase() && !sub.isEnterpriseCustom) {
      // Auto-sync if subscription plan name drifted from user's active rank in profiles/user table
      sub.plan = plan;
      sub.planId = plan.id;
      sub.planName = plan.name;
      sub.status = 'active';
      sub = await this.subRepo.save(sub);
      this.logger.log(`Auto-synced subscription for user ${userId} to active tier ${plan.name}`);
    }

    return sub;
  }

  /**
   * Retrieves dynamic, complete entitlements for a user based entirely on database records.
   * Full server-side administrator bypass is enforced if user is an admin.
   */
  async getUserEntitlements(userId: string, fallbackRank?: string): Promise<UserEntitlementsResponse> {
    const allFeatures = await this.featureRepo.find({ where: { isActive: true } });

    // 0. Full Server-Side Administrator Access Bypass
    const isAdmin = await this.isAdminUser(userId);
    if (isAdmin) {
      const adminFeatureMap: UserEntitlementsResponse['features'] = {};
      for (const feat of allFeatures) {
        adminFeatureMap[feat.key] = {
          key: feat.key,
          name: feat.name,
          enabled: true,
          limit: null, // Unlimited unmetered
          usedToday: 0,
          remainingToday: 'unlimited',
          config: null,
        };
      }

      return {
        userId,
        plan: {
          id: null,
          name: 'Enterprise (Admin Bypass)',
          slug: 'enterprise',
          status: 'active',
          billingInterval: 'unlimited',
          currentPeriodEnd: null,
          isEnterpriseCustom: true,
        },
        features: adminFeatureMap,
        allowedModels: [
          'claude-3-5-sonnet-20241022',
          'claude-3-opus',
          'llama-3.3-70b-versatile',
          'gemini-1.5-pro',
          'llama-3.1-8b-instant',
        ],
        usage: {
          aiChatsToday: 0,
          aiChatsLimit: 'unlimited',
          aiChatsRemaining: 'unlimited',
        },
      };
    }

    const sub = await this.getOrCreateSubscription(userId, fallbackRank);
    const today = this.getTodayPeriod();

    // Load usage counts for today
    const usages = await this.usageRepo.find({
      where: { userId, period: today },
    });
    const usageMap = new Map<string, number>();
    for (const u of usages) {
      usageMap.set(u.featureKey, u.usageCount);
    }

    const featureMap: UserEntitlementsResponse['features'] = {};
    let allowedModels: string[] = ['llama-3.1-8b-instant'];

    // 1. Enterprise Custom Subscription (Customer-Isolated Entitlements)
    if (sub.isEnterpriseCustom && sub.customFeatures) {
      try {
        const parsed = JSON.parse(sub.customFeatures);
        const approved: string[] = Array.isArray(parsed.approvedFeatures) ? parsed.approvedFeatures : [];
        const limits: Record<string, number | null> = parsed.featureLimits || {};

        if (Array.isArray(parsed.allowedModels) && parsed.allowedModels.length > 0) {
          allowedModels = parsed.allowedModels;
        }

        for (const feat of allFeatures) {
          const isApproved = approved.includes(feat.key);
          const customLimit = limits[feat.key] !== undefined ? limits[feat.key] : feat.defaultLimit;
          const usedToday = usageMap.get(feat.key) || 0;

          let remainingToday: number | 'unlimited' = 'unlimited';
          if (customLimit !== null && customLimit !== undefined) {
            remainingToday = Math.max(0, customLimit - usedToday);
          }

          featureMap[feat.key] = {
            key: feat.key,
            name: feat.name,
            enabled: isApproved && sub.status === 'active',
            limit: customLimit,
            usedToday,
            remainingToday,
            config: parsed.config?.[feat.key],
          };
        }
      } catch (err) {
        this.logger.error(`Error parsing enterprise customFeatures for user ${userId}:`, err);
      }
    } else {
      // 2. Standard / Catalog Plan Subscription with Hierarchical Feature Inheritance
      const plan =
        sub.plan ||
        (await this.planRepo.findOne({
          where: [
            { id: sub.planId || '' },
            { name: sub.planName || 'Free' },
            { slug: (sub.planName || 'free').toLowerCase() },
          ],
        }));

      // Dynamically resolve inherited features across Free -> Standard -> Premium -> Enterprise
      const resolvedFeatures = plan?.id ? await this.plansService.resolvePlanFeatures(plan.id) : [];
      const resolvedMap = new Map(resolvedFeatures.map((rf) => [rf.featureKey, rf]));

      for (const feat of allFeatures) {
        const rf = resolvedMap.get(feat.key);
        const enabled = Boolean(rf?.isEnabled && sub.status === 'active');
        const limit = rf ? rf.limitValue : feat.defaultLimit;
        const usedToday = usageMap.get(feat.key) || 0;

        let remainingToday: number | 'unlimited' = 'unlimited';
        if (limit !== null && limit !== undefined) {
          remainingToday = Math.max(0, limit - usedToday);
        }

        featureMap[feat.key] = {
          key: feat.key,
          name: feat.name,
          enabled,
          limit,
          usedToday,
          remainingToday,
          config: rf?.config,
        };
      }

      // Determine allowed AI models based on enabled features
      if (featureMap['claude_ai']?.enabled || featureMap['llama_ai']?.enabled) {
        allowedModels = [
          'claude-3-5-sonnet-20241022',
          'claude-3-opus',
          'llama-3.3-70b-versatile',
          'gemini-1.5-pro',
          'llama-3.1-8b-instant',
        ];
      } else if (featureMap['gemini_pro']?.enabled) {
        allowedModels = ['gemini-1.5-pro', 'llama-3.1-8b-instant'];
      } else {
        allowedModels = ['llama-3.1-8b-instant'];
      }
    }

    const aiLimit = featureMap['basic_ai_chat']?.limit ?? 5;
    const aiUsed = usageMap.get('basic_ai_chat') || 0;
    const aiRemaining = aiLimit === null ? 'unlimited' : Math.max(0, aiLimit - aiUsed);

    return {
      userId,
      plan: {
        id: sub.planId,
        name: sub.planName,
        slug: sub.plan?.slug || sub.planName.toLowerCase(),
        status: sub.status,
        billingInterval: sub.billingInterval,
        currentPeriodEnd: sub.currentPeriodEnd,
        isEnterpriseCustom: sub.isEnterpriseCustom,
      },
      features: featureMap,
      allowedModels,
      usage: {
        aiChatsToday: aiUsed,
        aiChatsLimit: aiLimit === null ? 'unlimited' : aiLimit,
        aiChatsRemaining: aiRemaining,
      },
    };
  }

  /**
   * Check if user is actively entitled to a specific feature.
   * Admins always have access.
   */
  async hasEntitlement(userId: string, featureKey: string): Promise<boolean> {
    if (await this.isAdminUser(userId)) return true;
    const entitlements = await this.getUserEntitlements(userId);
    const feat = entitlements.features[featureKey];
    return Boolean(feat && feat.enabled);
  }

  /**
   * Checks if user has remaining usage limit for a quota-controlled feature.
   * Admins bypass quota checks.
   */
  async checkUsageLimit(
    userId: string,
    featureKey: string,
    requestedAmount: number = 1,
  ): Promise<{ allowed: boolean; remaining: number | 'unlimited'; limit: number | 'unlimited'; used: number }> {
    if (await this.isAdminUser(userId)) {
      return { allowed: true, remaining: 'unlimited', limit: 'unlimited', used: 0 };
    }
    const entitlements = await this.getUserEntitlements(userId);
    const feat = entitlements.features[featureKey];

    if (!feat || !feat.enabled) {
      return { allowed: false, remaining: 0, limit: 0, used: 0 };
    }

    if (feat.limit === null) {
      return { allowed: true, remaining: 'unlimited', limit: 'unlimited', used: feat.usedToday };
    }

    const remaining = Math.max(0, feat.limit - feat.usedToday);
    const allowed = remaining >= requestedAmount;

    return {
      allowed,
      remaining,
      limit: feat.limit,
      used: feat.usedToday,
    };
  }

  /**
   * Atomically increments usage counter for a feature on the current date.
   * Admins are unmetered (usage counter is not consumed).
   */
  async consumeUsage(userId: string, featureKey: string, amount: number = 1): Promise<void> {
    if (await this.isAdminUser(userId)) {
      return; // Administrator bypass: unmetered
    }
    const period = this.getTodayPeriod();

    try {
      // Upsert using raw query for atomicity in PostgreSQL/SQLite
      await this.usageRepo.query(
        `INSERT INTO feature_usage (id, "userId", "featureKey", period, "usageCount", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())
         ON CONFLICT ("userId", "featureKey", period)
         DO UPDATE SET "usageCount" = feature_usage."usageCount" + $4, "updatedAt" = NOW();`,
        [userId, featureKey, period, amount],
      );
    } catch {
      // Fallback for SQLite or environments without gen_random_uuid()
      let record = await this.usageRepo.findOne({
        where: { userId, featureKey, period },
      });

      if (!record) {
        record = this.usageRepo.create({
          userId,
          featureKey,
          period,
          usageCount: amount,
        });
      } else {
        record.usageCount += amount;
      }
      await this.usageRepo.save(record);
    }
  }
}

