import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { UsersModule } from '../users/users.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [UsersModule, EventsModule],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}
