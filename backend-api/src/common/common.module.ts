import { Module } from '@nestjs/common';
import { PlanGuardService } from './plan-guard.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [PlanGuardService],
  exports: [PlanGuardService],
})
export class CommonModule {}
