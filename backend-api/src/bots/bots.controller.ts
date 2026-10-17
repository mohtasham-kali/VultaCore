import { Controller, Get, Post, Body, Param, Query, ForbiddenException } from '@nestjs/common';
import { BotsService } from './bots.service';
import { PlanGuardService } from '../common/plan-guard.service';
import { resolvePlanTier } from '../common/plan-limits';
import { UsersService } from '../users/users.service';

@Controller('bots')
export class BotsController {
  constructor(
    private readonly botsService: BotsService,
    private readonly planGuard: PlanGuardService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  findAll(@Query('type') type?: 'general' | 'cyber') {
    return this.botsService.findAll(type);
  }

  @Post(':id/execute')
  async execute(
    @Param('id') id: string,
    @Body('prompt') prompt: string,
    @Body('userId') userId: string,
    @Body('context') context?: string,
  ) {
    if (!userId) {
      throw new ForbiddenException('userId is required to execute a bot.');
    }

    // 1. Check daily AI chat limit
    const limitCheck = await this.planGuard.checkAiChatLimit(userId);
    if (!limitCheck.allowed) {
      throw new ForbiddenException(
        `Daily AI chat limit reached (${limitCheck.limit} chats/day on ${limitCheck.tier} plan). ` +
        `Upgrade your plan at /subscription to get more.`,
      );
    }

    // 2. Increment usage before executing
    this.planGuard.incrementAiUsage(userId);

    // 3. Execute the bot
    return this.botsService.executeBot(id, prompt, userId, context);
  }

  @Get(':id/history')
  getHistory(
    @Param('id') id: string,
    @Query('userId') userId: string,
  ) {
    if (!userId) {
      return [];
    }
    return this.botsService.getHistory(id, userId);
  }

  @Post('seed')
  seed() {
    return this.botsService.seed();
  }
}
