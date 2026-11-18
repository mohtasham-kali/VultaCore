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
   * Frontend calls this to get a Paddle hosted checkout URL.
   * POST /billing/checkout
   * Body: { planName: "Standard" | "Premium", userId: "...", userEmail: "..." }
   */
  @Post('checkout')
  async createCheckout(@Body() body: CheckoutDto) {
    const { planName, userId, userEmail } = body;
    if (!planName || !userId || !userEmail) {
      throw new BadRequestException(
        'planName, userId and userEmail are required.',
      );
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
   * Paddle fires this webhook after payment events.
   * POST /billing/webhook
   *
   * Paddle sends the signature in the `paddle-signature` header.
   * Raw body must be preserved for HMAC verification — ensure rawBody middleware
   * is configured in main.ts (bodyParser: false + RawBodyMiddleware, or
   * app.useGlobalMiddleware with rawBody: true in NestFactory.create options).
   */
  @Post('webhook')
  async handleWebhook(
    @Req() req: Request,
    @Headers('paddle-signature') signature: string,
  ) {
    const rawBody: Buffer = (req as any).rawBody;

    if (!rawBody) {
      throw new BadRequestException(
        'No raw body found. Ensure rawBody is preserved in main.ts.',
      );
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
