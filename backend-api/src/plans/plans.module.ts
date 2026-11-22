import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from './entities/plan.entity';
import { Feature } from './entities/feature.entity';
import { PlanFeature } from './entities/plan-feature.entity';
import { UserSubscription } from './entities/user-subscription.entity';
import { FeatureUsage } from './entities/feature-usage.entity';
import { EnterpriseInquiry } from './entities/enterprise-inquiry.entity';
import { SubscriptionAuditLog } from './entities/subscription-audit-log.entity';

import { PlansService } from './plans.service';
import { FeaturesService } from './features.service';
import { SubscriptionsService } from './subscriptions.service';
import { EntitlementsService } from './entitlements.service';
import { EnterpriseService } from './enterprise.service';
import { PlansController } from './plans.controller';
import { EntitlementGuard } from '../common/guards/entitlement.guard';

import { UsersModule } from '../users/users.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Plan,
      Feature,
      PlanFeature,
      UserSubscription,
      FeatureUsage,
      EnterpriseInquiry,
      SubscriptionAuditLog,
    ]),
    forwardRef(() => UsersModule),
    forwardRef(() => EventsModule),
  ],
  controllers: [PlansController],
  providers: [
    PlansService,
    FeaturesService,
    SubscriptionsService,
    EntitlementsService,
    EnterpriseService,
    EntitlementGuard,
  ],
  exports: [
    TypeOrmModule,
    PlansService,
    FeaturesService,
    SubscriptionsService,
    EntitlementsService,
    EnterpriseService,
    EntitlementGuard,
  ],
})
export class PlansModule {}
