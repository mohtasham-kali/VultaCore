import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { ChatGateway } from './chat/chat.gateway';
import { UsersService } from './users/users.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly chatGateway: ChatGateway,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('webhooks/revenuecat')
  async handleRevenueCatWebhook(@Body() payload: any) {
    if (!payload?.event) return { status: 'ignored' };
    
    // RevenueCat event payload structure
    const appUserId = payload.event.app_user_id;
    const type = payload.event.type; // INITIAL_PURCHASE, RENEWAL, etc
    const productId = payload.event.product_id;

    console.log(`[RevenueCat Webhook] User ${appUserId} triggered ${type} for ${productId}`);

    if (type === 'INITIAL_PURCHASE' || type === 'RENEWAL') {
      let rank = 'Free';
      if (productId.includes('standard')) rank = 'Standard';
      if (productId.includes('premium')) rank = 'Premium';

      // 1. Update your database
      await this.usersService.updatePlan(appUserId, rank);

      // 2. Blast the realtime socket update!
      this.chatGateway.notifyUserSubscriptionUpdated(appUserId, rank);
    }

    return { status: 'success' };
  }
}
