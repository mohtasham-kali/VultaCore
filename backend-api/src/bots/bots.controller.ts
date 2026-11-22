import { Controller, Get, Post, Body, Param, Query, ForbiddenException } from '@nestjs/common';
import { BotsService } from './bots.service';
import { PlanGuardService } from '../common/plan-guard.service';
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
    @Body('model') requestedModel?: string,
  ) {
    if (!userId) {
      throw new ForbiddenException('userId is required to execute a bot.');
    }

    // 0. Check Cyber Bot / Private Security Hub authorization
    const bot = await this.botsService.findOne(id);
    if (bot?.type === 'cyber') {
      const hasSecurity = await this.planGuard.canAccessSecurityHub(userId);
      if (!hasSecurity) {
        throw new ForbiddenException(
          'Private Security Hub bots require a Premium or Enterprise subscription. Upgrade your plan at /subscription to unlock cyber security tools.',
        );
      }
    }

    // 1. Check AI Model authorization
    if (requestedModel) {
      const allowedModels = await this.planGuard.getAllowedModels(userId);
      const isAllowed = allowedModels.some(
        (m) => m.toLowerCase().includes(requestedModel.toLowerCase()) || requestedModel.toLowerCase().includes(m.toLowerCase()),
      );
      if (!isAllowed) {
        throw new ForbiddenException(
          `AI Model "${requestedModel}" is not permitted under your active plan. Please upgrade at /subscription to unlock ${requestedModel}.`,
        );
      }
    }

    // 2. Check daily AI chat limit
    const limitCheck = await this.planGuard.checkAiChatLimit(userId);
    if (!limitCheck.allowed) {
      throw new ForbiddenException(
        `Daily AI chat limit reached (${limitCheck.limit} chats/day on ${limitCheck.tier} plan). ` +
        `Upgrade your plan at /subscription to get more.`,
      );
    }

    // 3. Increment usage before executing
    await this.planGuard.incrementAiUsage(userId);

    // 4. Execute the bot
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
