import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { BotsService } from './bots.service';

@Controller('bots')
export class BotsController {
  constructor(private readonly botsService: BotsService) {}

  @Get()
  findAll(@Query('type') type?: 'general' | 'cyber') {
    return this.botsService.findAll(type);
  }

  @Post(':id/execute')
  execute(
    @Param('id') id: string, 
    @Body('prompt') prompt: string,
    @Body('userId') userId: string,
    @Body('context') context?: string
  ) {
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
