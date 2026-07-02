import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { UsersModule } from '../users/users.module';
import { EventsModule } from '../events/events.module';
import { PlansModule } from '../plans/plans.module';

@Module({
  imports: [HttpModule, UsersModule, EventsModule, PlansModule],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}
