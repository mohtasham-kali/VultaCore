import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { PlanGuardService } from '../common/plan-guard.service';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), forwardRef(() => BillingModule)],
  providers: [UsersService, PlanGuardService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
