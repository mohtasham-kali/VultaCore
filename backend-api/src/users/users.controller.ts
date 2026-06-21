import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { PlanGuardService } from '../common/plan-guard.service';

@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private planGuard: PlanGuardService,
  ) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id/plan')
  updatePlan(@Param('id') id: string, @Body('plan') plan: string) {
    return this.usersService.updatePlan(id, plan);
  }

  /**
   * GET /api/users/:id/plan-info
   * Returns the user's plan tier, feature flags, and daily AI usage.
   * Used by frontend to gate features and show usage counters.
   */
  @Get(':id/plan-info')
  getPlanInfo(@Param('id') id: string) {
    return this.planGuard.getPlanInfo(id);
  }
}
