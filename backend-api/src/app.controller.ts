import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import { AppService } from './app.service';
import { ChatGateway } from './chat/chat.gateway';
import { UsersService } from './users/users.service';

// Constant-time comparison; fails closed if either value is missing.
function authMatches(provided?: string, expected?: string): boolean {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

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

  @Post('webhooks/lemonsqueezy')
  async handleLemonSqueezyWebhook(
    @Body() payload: any,
    @Headers('authorization') authHeader?: string,
  ) {
    // Reject anyone who doesn't send the shared secret.
    // If LEMONSQUEEZY_WEBHOOK_AUTH is not set, every request is rejected.
    if (!authMatches(authHeader, process.env.LEMONSQUEEZY_WEBHOOK_AUTH)) {
      throw new UnauthorizedException();
    }

    if (!payload?.event) return { status: 'ignored' };

    // LemonSqueezy event payload structure
    const appUserId = payload.event.app_user_id;
    const type = payload.event.type; // INITIAL_PURCHASE, RENEWAL, etc
    const productId = String(payload.event.product_id ?? '');

    console.log(
      `[LemonSqueez Webhook] User ${appUserId} triggered ${type} for ${productId}`,
    );

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