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
    @Body('context') context?: string
  ) {
    return this.botsService.executeBot(id, prompt, context);
  }

  @Post('seed')
  seed() {
    return this.botsService.seed();
  }
}
