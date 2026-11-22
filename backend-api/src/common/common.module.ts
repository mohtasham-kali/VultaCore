import { Module, forwardRef } from '@nestjs/common';
import { PlanGuardService } from './plan-guard.service';
import { UsersModule } from '../users/users.module';
import { PlansModule } from '../plans/plans.module';

@Module({
  imports: [forwardRef(() => UsersModule), forwardRef(() => PlansModule)],
  providers: [PlanGuardService],
  exports: [PlanGuardService],
})
export class CommonModule {}
