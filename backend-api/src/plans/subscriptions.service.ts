import { Injectable, Logger, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSubscription } from './entities/user-subscription.entity';
import { Plan } from './entities/plan.entity';
import { Feature } from './entities/feature.entity';
import { SubscriptionAuditLog } from './entities/subscription-audit-log.entity';
import { CustomizeEnterpriseDto, CalculateEnterprisePriceDto } from './dto/plans.dto';
import { UsersService } from '../users/users.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectRepository(UserSubscription)
    private readonly subRepo: Repository<UserSubscription>,
    @InjectRepository(Plan)
    private readonly planRepo: Repository<Plan>,
    @InjectRepository(Feature)
    private readonly featureRepo: Repository<Feature>,
    @InjectRepository(SubscriptionAuditLog)
    private readonly auditRepo: Repository<SubscriptionAuditLog>,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => EventsGateway))
    private readonly eventsGateway: EventsGateway,
  ) {}

  async getOverview(): Promise<{
    totalPlans: number;
    activePlans: number;
    totalSubscribers: number;
    freeSubscribers: number;
    standardSubscribers: number;
    premiumSubscribers: number;
    enterpriseSubscribers: number;
    mrr: number;
  }> {
    const plans = await this.planRepo.find();
    const subs = await this.subRepo.find({ where: { status: 'active' } });

    // Also count all users who might not have an explicit sub row yet (they are Free)
    const allUsers = await this.usersService.findAll();
    const userPlanMap = new Map<string, string>();

    for (const u of allUsers) {
      userPlanMap.set(u.id, u.rank || 'Free');
    }

    for (const s of subs) {
      userPlanMap.set(s.userId, s.planName || 'Free');
    }

    let free = 0;
    let standard = 0;
    let premium = 0;
    let enterprise = 0;
    let mrr = 0;

    userPlanMap.forEach((planName) => {
      const p = planName.toLowerCase();
      if (p === 'standard') {
        standard++;
        mrr += 29;
      } else if (p === 'premium') {
        premium++;
        mrr += 99;
      } else if (p === 'enterprise') {
        enterprise++;
        mrr += 299;
      } else {
        free++;
      }
    });

    return {
      totalPlans: plans.length,
      activePlans: plans.filter((p) => p.isActive).length,
      totalSubscribers: userPlanMap.size,
      freeSubscribers: free,
      standardSubscribers: standard,
      premiumSubscribers: premium,
      enterpriseSubscribers: enterprise,
      mrr,
    };
  }

  async getAllUserSubscriptions(filterPlan?: string): Promise<any[]> {
    const users = await this.usersService.findAll();
    const subs = await this.subRepo.find({
      relations: ['plan'],
      order: { updatedAt: 'DESC' },
    });

    const subMap = new Map<string, UserSubscription>();
    for (const s of subs) {
      if (!subMap.has(s.userId)) {
        subMap.set(s.userId, s);
      }
    }

    const result = users.map((u) => {
      const sub = subMap.get(u.id);
      const planName = sub?.planName || u.rank || 'Free';
      return {
        userId: u.id,
        username: u.username,
        email: u.email,
        planName,
        status: sub?.status || 'active',
        billingInterval: sub?.billingInterval || 'month',
        currentPeriodStart: sub?.currentPeriodStart || null,
        currentPeriodEnd: sub?.currentPeriodEnd || null,
        isEnterpriseCustom: Boolean(sub?.isEnterpriseCustom),
        customPrice: sub?.customPrice ?? null,
        customFeatures: sub?.customFeatures ? JSON.parse(sub.customFeatures) : null,
        subscriptionId: sub?.id || null,
      };
    });

    if (filterPlan && filterPlan !== 'ALL') {
      return result.filter((r) => r.planName.toLowerCase() === filterPlan.toLowerCase());
    }

    return result;
  }

  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    return this.subRepo.findOne({
      where: { userId },
      relations: ['plan', 'plan.planFeatures'],
      order: { createdAt: 'DESC' },
    });
  }

  async assignPlan(userId: string, planNameOrId: string, adminEmail: string = 'admin'): Promise<UserSubscription> {
    const plan = await this.planRepo.findOne({
      where: [{ id: planNameOrId }, { name: planNameOrId }, { slug: planNameOrId.toLowerCase() }],
    });

    const targetPlanName = plan ? plan.name : planNameOrId;

    let sub = await this.subRepo.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    const oldPlan = sub?.planName || 'Free';

    if (!sub) {
      sub = this.subRepo.create({
        userId,
        plan: plan || null,
        planId: plan?.id || null,
        planName: targetPlanName,
        status: 'active',
        billingInterval: 'month',
        isEnterpriseCustom: targetPlanName.toLowerCase() === 'enterprise',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
    } else {
      sub.plan = plan || null;
      sub.planId = plan?.id || null;
      sub.planName = targetPlanName;
      sub.status = 'active';
      sub.isEnterpriseCustom = targetPlanName.toLowerCase() === 'enterprise' ? sub.isEnterpriseCustom : false;
      sub.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    const saved = await this.subRepo.save(sub);

    // Sync with User entity / profiles
    await this.usersService.updatePlan(userId, targetPlanName, false);

    // Record audit log
    const audit: SubscriptionAuditLog = this.auditRepo.create({
      userId,
      adminEmail,
      action: 'SUBSCRIPTION_ASSIGNED',
      details: JSON.stringify({ oldPlan, newPlan: targetPlanName }),
    });
    await this.auditRepo.save(audit);

    // Emit real-time WebSocket update to connected clients
    this.eventsGateway.emitSubscriptionUpdated(userId, targetPlanName);

    this.logger.log(`Assigned plan ${targetPlanName} to user ${userId} by ${adminEmail}`);
    return saved;
  }

  /**
   * Calculates live dynamic Enterprise pricing based on base platform cost ($99/mo default)
   * plus selected add-on features ($5.00/mo default each, or admin configured per-feature price).
   */
  async calculateEnterprisePrice(dto: CalculateEnterprisePriceDto): Promise<{
    basePrice: number;
    featuresPrice: number;
    totalMonthlyPrice: number;
    totalYearlyPrice: number;
    selectedCount: number;
    breakdown: Array<{
      key: string;
      name: string;
      category: string;
      unitPrice: number;
      isCustomPrice: boolean;
    }>;
  }> {
    const basePrice = dto.basePrice !== undefined ? Number(dto.basePrice) : 99.0;
    const allFeatures = await this.featureRepo.find();
    const featMap = new Map<string, Feature>(allFeatures.map((f) => [f.key, f]));

    let featuresPrice = 0;
    const breakdown = [];

    const selected = Array.isArray(dto.selectedFeatures) ? dto.selectedFeatures : [];
    for (const key of selected) {
      const feat = featMap.get(key);
      const isCustom = dto.customFeaturePrices?.[key] !== undefined;
      const unitPrice = isCustom
        ? Number(dto.customFeaturePrices![key])
        : Number(feat?.enterprisePrice ?? 5.0);

      featuresPrice += unitPrice;
      breakdown.push({
        key,
        name: feat?.name || key,
        category: feat?.category || 'enterprise',
        unitPrice,
        isCustomPrice: isCustom,
      });
    }

    const totalMonthlyPrice = Number((basePrice + featuresPrice).toFixed(2));
    const totalYearlyPrice = Number((totalMonthlyPrice * 12).toFixed(2));

    return {
      basePrice,
      featuresPrice: Number(featuresPrice.toFixed(2)),
      totalMonthlyPrice,
      totalYearlyPrice,
      selectedCount: selected.length,
      breakdown,
    };
  }

  async customizeEnterprise(
    userId: string,
    dto: CustomizeEnterpriseDto,
    adminEmail: string = 'admin',
  ): Promise<UserSubscription> {
    let sub = await this.subRepo.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    const enterprisePlan = await this.planRepo.findOne({
      where: [{ name: 'Enterprise' }, { slug: 'enterprise' }],
    });

    const customFeaturesPayload = {
      approvedFeatures: dto.approvedFeatures || [],
      featureLimits: dto.featureLimits || {},
      allowedModels: dto.allowedModels || [
        'claude-3-5-sonnet-20241022',
        'claude-3-opus',
        'llama-3.3-70b-versatile',
        'gemini-1.5-pro',
        'llama-3.1-8b-instant',
      ],
      adminNotes: dto.adminNotes || '',
    };

    const effectiveStatus = dto.status || 'active';
    const effectivePrice = dto.customPrice !== undefined ? dto.customPrice : 99;

    if (!sub) {
      sub = this.subRepo.create({
        userId,
        plan: enterprisePlan || null,
        planId: enterprisePlan?.id || null,
        planName: 'Enterprise',
        status: effectiveStatus,
        billingInterval: dto.billingInterval || 'month',
        customPrice: effectivePrice,
        isEnterpriseCustom: true,
        customFeatures: JSON.stringify(customFeaturesPayload),
        currentPeriodStart: dto.startDate ? new Date(dto.startDate) : new Date(),
        currentPeriodEnd: dto.expirationDate
          ? new Date(dto.expirationDate)
          : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      });
    } else {
      sub.plan = enterprisePlan || null;
      sub.planId = enterprisePlan?.id || null;
      sub.planName = 'Enterprise';
      sub.status = effectiveStatus;
      sub.billingInterval = dto.billingInterval || sub.billingInterval || 'month';
      sub.customPrice = effectivePrice;
      sub.isEnterpriseCustom = true;
      sub.customFeatures = JSON.stringify(customFeaturesPayload);
      if (dto.startDate) sub.currentPeriodStart = new Date(dto.startDate);
      if (dto.expirationDate) sub.currentPeriodEnd = new Date(dto.expirationDate);
    }

    const saved = await this.subRepo.save(sub);

    // Sync user rank
    if (effectiveStatus === 'active') {
      await this.usersService.updatePlan(userId, 'Enterprise', false);
    } else if (effectiveStatus === 'canceled') {
      await this.usersService.updatePlan(userId, 'Free', false);
    }

    // Record audit log
    const audit: SubscriptionAuditLog = this.auditRepo.create({
      userId,
      adminEmail,
      action: 'ENTERPRISE_CUSTOMIZED',
      details: JSON.stringify({
        customPrice: sub.customPrice,
        approvedFeatures: customFeaturesPayload.approvedFeatures,
        status: sub.status,
        expirationDate: sub.currentPeriodEnd,
      }),
    });
    await this.auditRepo.save(audit);

    // Emit real-time WebSocket update
    this.eventsGateway.emitSubscriptionUpdated(userId, 'Enterprise');

    this.logger.log(`Customized Enterprise subscription for user ${userId} with ${customFeaturesPayload.approvedFeatures.length} features (status: ${sub.status})`);
    return saved;
  }

  async updateStatus(userId: string, status: string, adminEmail: string = 'admin'): Promise<UserSubscription> {
    const sub = await this.getUserSubscription(userId);
    if (!sub) {
      throw new NotFoundException(`No subscription found for user ${userId}`);
    }

    const oldStatus = sub.status;
    sub.status = status;
    const saved = await this.subRepo.save(sub);

    const audit: SubscriptionAuditLog = this.auditRepo.create({
      userId,
      adminEmail,
      action: 'STATUS_CHANGED',
      details: JSON.stringify({ oldStatus, newStatus: status }),
    });
    await this.auditRepo.save(audit);

    this.logger.log(`Updated subscription status for ${userId} to ${status}`);
    return saved;
  }
}
