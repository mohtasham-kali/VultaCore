import { Injectable, Logger, NotFoundException, ConflictException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Plan } from './entities/plan.entity';
import { Feature } from './entities/feature.entity';
import { PlanFeature } from './entities/plan-feature.entity';
import { SubscriptionAuditLog } from './entities/subscription-audit-log.entity';
import { CreatePlanDto, UpdatePlanDto } from './dto/plans.dto';
import { FeaturesService } from './features.service';

@Injectable()
export class PlansService implements OnModuleInit {
  private readonly logger = new Logger(PlansService.name);

  constructor(
    @InjectRepository(Plan)
    private readonly planRepo: Repository<Plan>,
    @InjectRepository(Feature)
    private readonly featureRepo: Repository<Feature>,
    @InjectRepository(PlanFeature)
    private readonly planFeatureRepo: Repository<PlanFeature>,
    @InjectRepository(SubscriptionAuditLog)
    private readonly auditRepo: Repository<SubscriptionAuditLog>,
    private readonly featuresService: FeaturesService,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    await this.ensureTablesAndColumns();
    await this.featuresService.seedInitialFeatures();
    await this.seedInitialPlans();
  }

  /**
   * Safe runtime migration: creates tables and adds columns if missing.
   * Works on both PostgreSQL (production) and SQLite (testing).
   */
  private async ensureTablesAndColumns(): Promise<void> {
    try {
      const isPg = this.dataSource.options.type === 'postgres';

      if (isPg) {
        // PostgreSQL DDL
        await this.dataSource.query(`
          -- Feature Table
          CREATE TABLE IF NOT EXISTS feature (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            key varchar UNIQUE NOT NULL,
            name varchar NOT NULL,
            description text DEFAULT '',
            category varchar DEFAULT 'community',
            type varchar DEFAULT 'boolean',
            "defaultLimit" integer,
            "isActive" boolean DEFAULT true,
            metadata text,
            "createdAt" timestamp with time zone DEFAULT NOW(),
            "updatedAt" timestamp with time zone DEFAULT NOW()
          );

          -- Plan Table Updates
          ALTER TABLE plan ADD COLUMN IF NOT EXISTS slug varchar DEFAULT '';
          ALTER TABLE plan ADD COLUMN IF NOT EXISTS description text DEFAULT '';
          ALTER TABLE plan ADD COLUMN IF NOT EXISTS category varchar DEFAULT 'developer';
          ALTER TABLE plan ADD COLUMN IF NOT EXISTS "monthlyPrice" numeric(10,2) DEFAULT 0;
          ALTER TABLE plan ADD COLUMN IF NOT EXISTS "yearlyPrice" numeric(10,2) DEFAULT 0;
          ALTER TABLE plan ADD COLUMN IF NOT EXISTS currency varchar DEFAULT 'USD';
          ALTER TABLE plan ADD COLUMN IF NOT EXISTS "isCustomPricing" boolean DEFAULT false;
          ALTER TABLE plan ADD COLUMN IF NOT EXISTS "isActive" boolean DEFAULT true;
          ALTER TABLE plan ADD COLUMN IF NOT EXISTS "isPublic" boolean DEFAULT true;
          ALTER TABLE plan ADD COLUMN IF NOT EXISTS "isPublished" boolean DEFAULT true;
          ALTER TABLE plan ADD COLUMN IF NOT EXISTS "isRecommended" boolean DEFAULT false;
          ALTER TABLE plan ADD COLUMN IF NOT EXISTS badge varchar;
          ALTER TABLE plan ADD COLUMN IF NOT EXISTS "displayOrder" integer DEFAULT 0;
          ALTER TABLE plan ADD COLUMN IF NOT EXISTS version integer DEFAULT 1;
          ALTER TABLE plan ADD COLUMN IF NOT EXISTS "inheritsPlanId" uuid;
          ALTER TABLE plan ADD COLUMN IF NOT EXISTS "inheritsPlanSlug" varchar;
          ALTER TABLE plan ADD COLUMN IF NOT EXISTS "planChangePolicy" varchar DEFAULT 'immediate';
          ALTER TABLE plan ADD COLUMN IF NOT EXISTS "paddlePriceIdMonth" varchar;
          ALTER TABLE plan ADD COLUMN IF NOT EXISTS "paddlePriceIdYear" varchar;
          ALTER TABLE plan ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT NOW();
          ALTER TABLE plan ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone DEFAULT NOW();

          -- Feature Table Updates
          ALTER TABLE feature ADD COLUMN IF NOT EXISTS "enterprisePrice" numeric(10,2) DEFAULT 5.00;

          -- PlanFeature Table
          CREATE TABLE IF NOT EXISTS plan_feature (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "planId" uuid REFERENCES plan(id) ON DELETE CASCADE,
            "featureId" uuid REFERENCES feature(id) ON DELETE CASCADE,
            "isEnabled" boolean DEFAULT true,
            "limitValue" integer,
            config text,
            "createdAt" timestamp with time zone DEFAULT NOW(),
            "updatedAt" timestamp with time zone DEFAULT NOW()
          );

          -- UserSubscription Table
          CREATE TABLE IF NOT EXISTS user_subscription (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "userId" varchar NOT NULL,
            "planId" uuid REFERENCES plan(id) ON DELETE SET NULL,
            "planName" varchar DEFAULT 'Free',
            status varchar DEFAULT 'active',
            "billingInterval" varchar DEFAULT 'month',
            "currentPeriodStart" timestamp with time zone,
            "currentPeriodEnd" timestamp with time zone,
            "cancelAtPeriodEnd" boolean DEFAULT false,
            "customPrice" numeric(10,2),
            "isEnterpriseCustom" boolean DEFAULT false,
            "customFeatures" text,
            "paddleSubscriptionId" varchar,
            "paddleCustomerId" varchar,
            "createdAt" timestamp with time zone DEFAULT NOW(),
            "updatedAt" timestamp with time zone DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_user_sub_userid ON user_subscription("userId");

          -- FeatureUsage Table
          CREATE TABLE IF NOT EXISTS feature_usage (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "userId" varchar NOT NULL,
            "featureKey" varchar NOT NULL,
            period varchar NOT NULL,
            "usageCount" integer DEFAULT 0,
            "updatedAt" timestamp with time zone DEFAULT NOW(),
            CONSTRAINT uq_user_feature_period UNIQUE ("userId", "featureKey", period)
          );

          -- EnterpriseInquiry Table
          CREATE TABLE IF NOT EXISTS enterprise_inquiry (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            reference varchar UNIQUE NOT NULL,
            "userId" varchar,
            "fullName" varchar NOT NULL,
            "companyName" varchar NOT NULL,
            email varchar NOT NULL,
            phone varchar DEFAULT '',
            "requestedFeatures" text NOT NULL,
            "numberOfUsers" varchar DEFAULT '1-10',
            "expectedUsage" text,
            "customRequirements" text,
            "additionalMessage" text,
            status varchar DEFAULT 'new',
            "adminNotes" text,
            "createdAt" timestamp with time zone DEFAULT NOW(),
            "updatedAt" timestamp with time zone DEFAULT NOW()
          );

          -- SubscriptionAuditLog Table
          CREATE TABLE IF NOT EXISTS subscription_audit_log (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "userId" varchar,
            "adminEmail" varchar DEFAULT 'admin',
            action varchar NOT NULL,
            details text NOT NULL,
            "createdAt" timestamp with time zone DEFAULT NOW()
          );
        `);
      }
      this.logger.log('Database tables and columns verified.');
    } catch (err: any) {
      this.logger.warn(`ensureTablesAndColumns warning: ${err?.message || err}`);
    }
  }

  async findAll(includeInactive = true): Promise<Plan[]> {
    const query = this.planRepo
      .createQueryBuilder('plan')
      .leftJoinAndSelect('plan.planFeatures', 'pf')
      .leftJoinAndSelect('pf.feature', 'feature')
      .orderBy('plan.displayOrder', 'ASC');

    if (!includeInactive) {
      query.where('plan.isActive = :isActive', { isActive: true });
    }

    return query.getMany();
  }

  /**
   * Dynamically resolves all hierarchical inherited features for a given plan.
   * Inheritance chain: FREE -> STANDARD -> PREMIUM -> ENTERPRISE
   * Higher-tier plans automatically inherit all features from their parent plans,
   * while overriding limitValue, isEnabled, or config without duplicating entries.
   */
  async resolvePlanFeatures(planIdOrSlug: string): Promise<Array<{
    featureId: string;
    featureKey: string;
    name: string;
    description: string;
    category: string;
    type: string;
    isEnabled: boolean;
    limitValue: number | null;
    config: any;
    enterprisePrice: number;
    inheritedFrom: string | null;
  }>> {
    const targetPlan = await this.planRepo.findOne({
      where: [{ id: planIdOrSlug }, { slug: planIdOrSlug.toLowerCase() }],
    });

    if (!targetPlan) {
      return [];
    }

    // Traverse inheritance hierarchy up to root
    const chain: Plan[] = [targetPlan];
    const visited = new Set<string>([targetPlan.id]);

    let curr = targetPlan;
    while (curr.inheritsPlanId || curr.inheritsPlanSlug) {
      const parent = await this.planRepo.findOne({
        where: curr.inheritsPlanId
          ? { id: curr.inheritsPlanId }
          : { slug: curr.inheritsPlanSlug! },
      });

      if (!parent || visited.has(parent.id)) {
        break; // Guard against missing parents or cycles
      }

      visited.add(parent.id);
      chain.unshift(parent); // Prepend to chain so root (Free) is index 0
      curr = parent;
    }

    // Load all features for fast reference
    const allFeatures = await this.featureRepo.find();
    const featById = new Map<string, Feature>(allFeatures.map((f) => [f.id, f]));

    // Merge features in order: Root -> Child -> Leaf
    const mergedMap = new Map<
      string,
      {
        featureId: string;
        featureKey: string;
        name: string;
        description: string;
        category: string;
        type: string;
        isEnabled: boolean;
        limitValue: number | null;
        config: any;
        enterprisePrice: number;
        inheritedFrom: string | null;
      }
    >();

    for (const plan of chain) {
      const planFeatures = await this.planFeatureRepo.find({
        where: { planId: plan.id },
        relations: ['feature'],
      });

      for (const pf of planFeatures) {
        const feat = pf.feature || featById.get(pf.featureId);
        if (!feat) continue;

        let parsedConfig: any = null;
        if (pf.config) {
          try {
            parsedConfig = JSON.parse(pf.config);
          } catch {
            parsedConfig = pf.config;
          }
        }

        const isInherited = plan.id !== targetPlan.id;

        mergedMap.set(feat.key, {
          featureId: feat.id,
          featureKey: feat.key,
          name: feat.name,
          description: feat.description,
          category: feat.category,
          type: feat.type,
          isEnabled: pf.isEnabled,
          limitValue: pf.limitValue,
          config: parsedConfig,
          enterprisePrice: Number(feat.enterprisePrice || 5.00),
          inheritedFrom: isInherited ? plan.name : null,
        });
      }
    }

    return Array.from(mergedMap.values());
  }

  async findPublished(): Promise<Plan[]> {
    const plans = await this.planRepo
      .createQueryBuilder('plan')
      .leftJoinAndSelect('plan.planFeatures', 'pf')
      .leftJoinAndSelect('pf.feature', 'feature')
      .where('plan.isActive = true')
      .andWhere('plan.isPublished = true')
      .andWhere('plan.isPublic = true')
      .orderBy('plan.displayOrder', 'ASC')
      .getMany();

    // Enrich each published plan with dynamically resolved inherited features
    for (const plan of plans) {
      const resolved = await this.resolvePlanFeatures(plan.id);
      (plan as any).resolvedFeatures = resolved;

      // Populate planFeatures with resolved items so frontend sees all inherited features
      plan.planFeatures = resolved.map((rf) => ({
        id: rf.featureId,
        planId: plan.id,
        featureId: rf.featureId,
        isEnabled: rf.isEnabled,
        limitValue: rf.limitValue,
        config: typeof rf.config === 'object' ? JSON.stringify(rf.config) : rf.config,
        feature: {
          id: rf.featureId,
          key: rf.featureKey,
          name: rf.name,
          description: rf.description,
          category: rf.category,
          type: rf.type,
          defaultLimit: rf.limitValue,
          enterprisePrice: rf.enterprisePrice,
          isActive: true,
        } as any,
        createdAt: new Date(),
        updatedAt: new Date(),
        plan,
      }));

      // Also populate string features array
      plan.features = resolved
        .filter((rf) => rf.isEnabled)
        .map((rf) => (rf.limitValue ? `${rf.name} (${rf.limitValue}/day)` : rf.name));
    }

    return plans;
  }

  async findOne(idOrSlug: string): Promise<Plan> {
    const plan = await this.planRepo.findOne({
      where: [{ id: idOrSlug }, { slug: idOrSlug }],
      relations: ['planFeatures', 'planFeatures.feature'],
    });

    if (!plan) {
      throw new NotFoundException(`Plan "${idOrSlug}" not found`);
    }

    return plan;
  }

  async create(dto: CreatePlanDto, adminEmail: string = 'admin'): Promise<Plan> {
    const slug = dto.slug ? dto.slug.toLowerCase().trim() : dto.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const existing = await this.planRepo.findOne({ where: { slug } });
    if (existing) {
      throw new ConflictException(`Plan with slug "${slug}" already exists`);
    }

    const plan: Plan = this.planRepo.create({
      name: dto.name,
      slug,
      description: dto.description || '',
      category: dto.category || 'developer',
      price: dto.monthlyPrice || 0,
      monthlyPrice: dto.monthlyPrice || 0,
      yearlyPrice: dto.yearlyPrice || (dto.monthlyPrice ? dto.monthlyPrice * 12 : 0),
      currency: dto.currency || 'USD',
      interval: dto.interval || 'month',
      isCustomPricing: Boolean(dto.isCustomPricing),
      isActive: dto.isActive !== undefined ? dto.isActive : true,
      isPublic: dto.isPublic !== undefined ? dto.isPublic : true,
      isPublished: dto.isPublished !== undefined ? dto.isPublished : true,
      isRecommended: Boolean(dto.isRecommended),
      badge: dto.badge || null,
      displayOrder: dto.displayOrder || 0,
      version: 1,
      inheritsPlanId: dto.inheritsPlanId || null,
      inheritsPlanSlug: dto.inheritsPlanSlug || null,
      planChangePolicy: dto.planChangePolicy || 'immediate',
      paddlePriceIdMonth: dto.paddlePriceIdMonth || null,
      paddlePriceIdYear: dto.paddlePriceIdYear || null,
    });

    const savedPlan = await this.planRepo.save(plan);

    // Assign features
    if (dto.features && Array.isArray(dto.features)) {
      for (const item of dto.features) {
        const pf: PlanFeature = this.planFeatureRepo.create({
          planId: savedPlan.id,
          featureId: item.featureId,
          isEnabled: item.isEnabled !== undefined ? item.isEnabled : true,
          limitValue: item.limitValue !== undefined ? item.limitValue : null,
          config: typeof item.config === 'object' ? JSON.stringify(item.config) : item.config || null,
        });
        await this.planFeatureRepo.save(pf);
      }
    }

    // Audit log
    const audit: SubscriptionAuditLog = this.auditRepo.create({
      adminEmail,
      action: 'PLAN_CREATED',
      details: JSON.stringify({ planId: savedPlan.id, name: savedPlan.name, slug: savedPlan.slug }),
    });
    await this.auditRepo.save(audit);

    return this.findOne(savedPlan.id);
  }

  async update(id: string, dto: UpdatePlanDto, adminEmail: string = 'admin'): Promise<Plan> {
    const plan = await this.findOne(id);

    if (dto.name !== undefined) plan.name = dto.name;
    if (dto.slug !== undefined) plan.slug = dto.slug.toLowerCase().trim();
    if (dto.description !== undefined) plan.description = dto.description;
    if (dto.category !== undefined) plan.category = dto.category;
    if (dto.monthlyPrice !== undefined) {
      plan.monthlyPrice = dto.monthlyPrice;
      plan.price = dto.monthlyPrice;
    }
    if (dto.yearlyPrice !== undefined) plan.yearlyPrice = dto.yearlyPrice;
    if (dto.currency !== undefined) plan.currency = dto.currency;
    if (dto.interval !== undefined) plan.interval = dto.interval;
    if (dto.isCustomPricing !== undefined) plan.isCustomPricing = dto.isCustomPricing;
    if (dto.isActive !== undefined) plan.isActive = dto.isActive;
    if (dto.isPublic !== undefined) plan.isPublic = dto.isPublic;
    if (dto.isPublished !== undefined) plan.isPublished = dto.isPublished;
    if (dto.isRecommended !== undefined) plan.isRecommended = dto.isRecommended;
    if (dto.badge !== undefined) plan.badge = dto.badge;
    if (dto.displayOrder !== undefined) plan.displayOrder = dto.displayOrder;
    if (dto.inheritsPlanId !== undefined) plan.inheritsPlanId = dto.inheritsPlanId || null;
    if (dto.inheritsPlanSlug !== undefined) plan.inheritsPlanSlug = dto.inheritsPlanSlug || null;
    if (dto.planChangePolicy !== undefined) plan.planChangePolicy = dto.planChangePolicy;
    if (dto.paddlePriceIdMonth !== undefined) plan.paddlePriceIdMonth = dto.paddlePriceIdMonth;
    if (dto.paddlePriceIdYear !== undefined) plan.paddlePriceIdYear = dto.paddlePriceIdYear;

    plan.version += 1;
    await this.planRepo.save(plan);

    // Update assigned features if provided
    if (dto.features && Array.isArray(dto.features)) {
      // Remove existing plan features
      await this.planFeatureRepo.delete({ planId: plan.id });

      for (const item of dto.features) {
        const pf: PlanFeature = this.planFeatureRepo.create({
          planId: plan.id,
          featureId: item.featureId,
          isEnabled: item.isEnabled !== undefined ? item.isEnabled : true,
          limitValue: item.limitValue !== undefined ? item.limitValue : null,
          config: typeof item.config === 'object' ? JSON.stringify(item.config) : item.config || null,
        });
        await this.planFeatureRepo.save(pf);
      }
    }

    // Audit log
    const audit: SubscriptionAuditLog = this.auditRepo.create({
      adminEmail,
      action: 'PLAN_UPDATED',
      details: JSON.stringify({ planId: plan.id, name: plan.name, version: plan.version }),
    });
    await this.auditRepo.save(audit);

    return this.findOne(plan.id);
  }

  async duplicate(id: string, adminEmail: string = 'admin'): Promise<Plan> {
    const source = await this.findOne(id);
    const newSlug = `${source.slug}-copy-${Math.floor(100 + Math.random() * 900)}`;

    const plan: Plan = this.planRepo.create({
      name: `${source.name} (Copy)`,
      slug: newSlug,
      description: source.description,
      category: source.category,
      price: source.monthlyPrice,
      monthlyPrice: source.monthlyPrice,
      yearlyPrice: source.yearlyPrice,
      currency: source.currency,
      interval: source.interval,
      isCustomPricing: source.isCustomPricing,
      isActive: true,
      isPublic: false,
      isPublished: false, // Start as draft
      isRecommended: false,
      badge: source.badge,
      displayOrder: source.displayOrder + 1,
      version: 1,
      inheritsPlanId: source.inheritsPlanId,
      inheritsPlanSlug: source.inheritsPlanSlug,
      planChangePolicy: source.planChangePolicy,
      paddlePriceIdMonth: source.paddlePriceIdMonth,
      paddlePriceIdYear: source.paddlePriceIdYear,
    });

    const savedPlan = await this.planRepo.save(plan);

    // Duplicate assigned features
    if (source.planFeatures) {
      for (const pf of source.planFeatures) {
        const copyPf: PlanFeature = this.planFeatureRepo.create({
          planId: savedPlan.id,
          featureId: pf.featureId,
          isEnabled: pf.isEnabled,
          limitValue: pf.limitValue,
          config: pf.config,
        });
        await this.planFeatureRepo.save(copyPf);
      }
    }

    const audit: SubscriptionAuditLog = this.auditRepo.create({
      adminEmail,
      action: 'PLAN_DUPLICATED',
      details: JSON.stringify({ sourceId: id, newPlanId: savedPlan.id, slug: savedPlan.slug }),
    });
    await this.auditRepo.save(audit);

    return this.findOne(savedPlan.id);
  }

  async archive(id: string, adminEmail: string = 'admin'): Promise<Plan> {
    const plan = await this.findOne(id);
    plan.isActive = false;
    plan.isPublished = false;
    plan.isPublic = false;
    const saved = await this.planRepo.save(plan);

    const audit: SubscriptionAuditLog = this.auditRepo.create({
      adminEmail,
      action: 'PLAN_ARCHIVED',
      details: JSON.stringify({ planId: plan.id, name: plan.name }),
    });
    await this.auditRepo.save(audit);

    this.logger.log(`Archived plan ${plan.name} (${plan.id})`);
    return saved;
  }

  async seedInitialPlans(): Promise<void> {
    const allFeatures = await this.featureRepo.find();
    const featureMap = new Map<string, Feature>();
    for (const f of allFeatures) {
      featureMap.set(f.key, f);
    }

    const plansToSeed = [
      {
        name: 'Free',
        slug: 'free',
        description: 'Perfect for exploring the platform and participating in developer discussions.',
        category: 'general',
        monthlyPrice: 0,
        yearlyPrice: 0,
        currency: 'USD',
        interval: 'month',
        isCustomPricing: false,
        isActive: true,
        isPublic: true,
        isPublished: true,
        isRecommended: false,
        badge: null,
        displayOrder: 0,
        inheritsPlanSlug: null,
        paddlePriceIdMonth: 'pri_01m7zga17631vansgnv8844tqp',
        features: [
          { key: 'community_forum', limit: null },
          { key: 'standard_support', limit: null },
          { key: 'basic_ai_chat', limit: 5 },
          { key: 'public_analytics', limit: null },
        ],
      },
      {
        name: 'Standard',
        slug: 'standard',
        description: 'Best for active developers who need automated code assistance and deep analytics.',
        category: 'developer',
        monthlyPrice: 29,
        yearlyPrice: 348,
        currency: 'USD',
        interval: 'both',
        isCustomPricing: false,
        isActive: true,
        isPublic: true,
        isPublished: true,
        isRecommended: true,
        badge: 'Most Popular',
        displayOrder: 1,
        inheritsPlanSlug: 'free',
        paddlePriceIdMonth: 'pri_01m7r11zk5c3bma7a6k0y70g5n',
        paddlePriceIdYear: 'pri_01m7zg022mbd9npg4k7d9462w4',
        features: [
          { key: 'community_forum', limit: null },
          { key: 'priority_forum_support', limit: null },
          { key: 'gemini_pro', limit: null },
          { key: 'basic_ai_chat', limit: 100 },
          { key: 'personal_analytics', limit: 1 },
          { key: 'public_analytics', limit: null },
          { key: 'api_access', limit: 5000 },
          { key: 'standard_support', limit: null },
        ],
      },
      {
        name: 'Premium',
        slug: 'premium',
        description: 'For security professionals requiring full cyber threat intel and advanced AI reasoning.',
        category: 'security',
        monthlyPrice: 99,
        yearlyPrice: 1188,
        currency: 'USD',
        interval: 'both',
        isCustomPricing: false,
        isActive: true,
        isPublic: true,
        isPublished: true,
        isRecommended: false,
        badge: 'Advanced Security',
        displayOrder: 2,
        inheritsPlanSlug: 'standard',
        paddlePriceIdMonth: 'pri_01m7r12e4rwbrt25331y3sm88p',
        paddlePriceIdYear: 'pri_01m7zga0kvb5ycrvpa9mw8n1f1',
        features: [
          { key: 'private_security_hub', limit: null },
          { key: 'advanced_threat_intel', limit: null },
          { key: 'claude_ai', limit: null },
          { key: 'llama_ai', limit: null },
          { key: 'gemini_pro', limit: null },
          { key: 'basic_ai_chat', limit: null },
          { key: 'unlimited_api', limit: null },
          { key: 'personal_analytics', limit: null },
          { key: 'public_analytics', limit: null },
          { key: 'priority_forum_support', limit: null },
          { key: 'community_forum', limit: null },
        ],
      },
      {
        name: 'Enterprise',
        slug: 'enterprise',
        description: 'Tailored infrastructure, dedicated security tooling, and SLA guarantees for enterprise teams.',
        category: 'enterprise',
        monthlyPrice: 99,
        yearlyPrice: 1188,
        currency: 'USD',
        interval: 'both',
        isCustomPricing: true,
        isActive: true,
        isPublic: true,
        isPublished: true,
        isRecommended: false,
        badge: 'Enterprise Grade',
        displayOrder: 3,
        inheritsPlanSlug: 'premium',
        paddlePriceIdMonth: 'pri_01m7zga1swv0y3tfj78g7bkqvj',
        paddlePriceIdYear: 'pri_01m7zga22j5raphwqxbe31fgex',
        features: [
          { key: 'sla_guarantees', limit: null },
          { key: 'dedicated_ai_instance', limit: null },
          { key: 'white_label', limit: null },
          { key: 'phone_support_24_7', limit: null },
          { key: 'private_security_hub', limit: null },
          { key: 'advanced_threat_intel', limit: null },
          { key: 'claude_ai', limit: null },
          { key: 'llama_ai', limit: null },
          { key: 'gemini_pro', limit: null },
          { key: 'basic_ai_chat', limit: null },
          { key: 'unlimited_api', limit: null },
          { key: 'personal_analytics', limit: null },
          { key: 'public_analytics', limit: null },
          { key: 'priority_forum_support', limit: null },
          { key: 'community_forum', limit: null },
        ],
      },
    ];

    for (const item of plansToSeed) {
      let plan = await this.planRepo.findOne({
        where: [{ slug: item.slug }, { name: item.name }],
        relations: ['planFeatures'],
      });

      if (!plan) {
        this.logger.log(`Seeding plan: ${item.name}`);
        const newPlan: Plan = this.planRepo.create({
          name: item.name,
          slug: item.slug,
          description: item.description,
          category: item.category,
          price: item.monthlyPrice,
          monthlyPrice: item.monthlyPrice,
          yearlyPrice: item.yearlyPrice,
          currency: item.currency,
          interval: item.interval,
          isCustomPricing: item.isCustomPricing,
          isActive: item.isActive,
          isPublic: item.isPublic,
          isPublished: item.isPublished,
          isRecommended: item.isRecommended,
          badge: item.badge,
          displayOrder: item.displayOrder,
          inheritsPlanSlug: item.inheritsPlanSlug,
          version: 1,
          paddlePriceIdMonth: item.paddlePriceIdMonth,
          paddlePriceIdYear: item.paddlePriceIdYear,
        });
        plan = await this.planRepo.save(newPlan);
      } else {
        // Ensure slug and pricing are synced
        if (!plan.slug || plan.slug === '') {
          plan.slug = item.slug;
        }
        if (plan.monthlyPrice === 0 && item.monthlyPrice > 0) {
          plan.monthlyPrice = item.monthlyPrice;
        }
        if (item.inheritsPlanSlug !== undefined && plan.inheritsPlanSlug !== item.inheritsPlanSlug) {
          plan.inheritsPlanSlug = item.inheritsPlanSlug;
        }
        if (item.paddlePriceIdMonth && !plan.paddlePriceIdMonth) {
          plan.paddlePriceIdMonth = item.paddlePriceIdMonth;
        }
        if (item.paddlePriceIdYear && !plan.paddlePriceIdYear) {
          plan.paddlePriceIdYear = item.paddlePriceIdYear;
        }
        await this.planRepo.save(plan);
      }

      // Link inheritsPlanId if inheritsPlanSlug is present
      if (plan.inheritsPlanSlug && !plan.inheritsPlanId) {
        const parentPlan = await this.planRepo.findOne({ where: { slug: plan.inheritsPlanSlug } });
        if (parentPlan) {
          plan.inheritsPlanId = parentPlan.id;
          await this.planRepo.save(plan);
        }
      }

      // Ensure plan features exist and reflect accurate limits
      const existingFeatures = await this.planFeatureRepo.find({ where: { planId: plan.id } });
      const existingFeatureMap = new Map(existingFeatures.map((pf) => [pf.featureId, pf]));

      for (const fItem of item.features) {
        const feat = featureMap.get(fItem.key);
        if (feat) {
          const existingPf = existingFeatureMap.get(feat.id);
          if (!existingPf) {
            const pf: PlanFeature = this.planFeatureRepo.create({
              planId: plan.id,
              featureId: feat.id,
              isEnabled: true,
              limitValue: fItem.limit,
            });
            await this.planFeatureRepo.save(pf);
          } else if (existingPf.limitValue !== fItem.limit) {
            existingPf.limitValue = fItem.limit;
            await this.planFeatureRepo.save(existingPf);
          }
        }
      }
    }
  }
}
