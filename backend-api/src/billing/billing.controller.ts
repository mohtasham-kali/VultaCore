import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { BillingService } from './billing.service';

interface CheckoutDto {
  planName: string;
  userId: string;
  userEmail: string;
}

@Controller('billing')
export class BillingController {
  private readonly logger = new Logger(BillingController.name);

  constructor(private readonly billingService: BillingService) {}

  /**
   * Frontend calls this to get a Lemon Squeezy checkout URL.
   * POST /billing/checkout
   * Body: { planName: "Standard" | "Premium", userId: "...", userEmail: "..." }
   */
  @Post('checkout')
  async createCheckout(@Body() body: CheckoutDto) {
    const { planName, userId, userEmail } = body;
    if (!planName || !userId || !userEmail) {
      throw new BadRequestException('planName, userId and userEmail are required.');
    }

    try {
      const url = await this.billingService.createCheckoutSession(
        planName,
        userId,
        userEmail,
      );
      return { checkoutUrl: url };
    } catch (err: unknown) {
      const message = (err as Error).message;
      this.logger.error(`Checkout creation failed: ${message}`);
      throw new BadRequestException(message);
    }
  }

  /**
   * Lemon Squeezy fires this webhook after payment.
   * POST /billing/webhook
   * Must receive raw body for HMAC verification — uses RawBodyMiddleware.
   */
  @Post('webhook')
  async handleWebhook(
    @Req() req: Request,
    @Headers('x-signature') signature: string,
  ) {
    const rawBody: Buffer = (req as any).rawBody;

    if (!rawBody) {
      throw new BadRequestException('No raw body found. Check middleware config.');
    }

    try {
      await this.billingService.handleWebhook(rawBody, signature);
      return { received: true };
    } catch (err: unknown) {
      const message = (err as Error).message;
      this.logger.error(`Webhook error: ${message}`);
      throw new BadRequestException(message);
    }
  }
}
