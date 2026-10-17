import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { EventsGateway } from '../events/events.gateway';

const PLAN_VARIANT_MAP: Record<string, string> = {
  Standard: 'standard',
  Premium: 'premium',
};

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly lsApiKey: string;
  private readonly lsStoreId: string;
  private readonly lsWebhookSecret: string;
  private readonly appUrl: string;

  // Map Lemon Squeezy variant IDs to plan names — fill these in from your LS dashboard
  private readonly variantToPlan: Record<string, string> = {
    // e.g. '123456': 'Standard', '789012': 'Premium'
    // These are set via LS_VARIANT_STANDARD and LS_VARIANT_PREMIUM env vars
  };

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
    private readonly eventsGateway: EventsGateway,
  ) {
    this.lsApiKey = this.config.get<string>('LS_API_KEY', '');
    this.lsStoreId = this.config.get<string>('LS_STORE_ID', '');
    this.lsWebhookSecret = this.config.get<string>('LS_WEBHOOK_SECRET', '');
    this.appUrl = this.config.get<string>('APP_URL', 'http://localhost:3000');

    // Build variant → plan mapping from env
    const variantStandard = this.config.get<string>('LS_VARIANT_STANDARD', '');
    const variantPremium = this.config.get<string>('LS_VARIANT_PREMIUM', '');
    if (variantStandard) this.variantToPlan[variantStandard] = 'Standard';
    if (variantPremium) this.variantToPlan[variantPremium] = 'Premium';
  }

  /**
   * Creates a Lemon Squeezy hosted checkout session and returns the checkout URL.
   */
  async createCheckoutSession(
    planName: string,
    userId: string,
    userEmail: string,
  ): Promise<string> {
    const variantId = this.config.get<string>(
      `LS_VARIANT_${planName.toUpperCase()}`,
    );

    if (!variantId) {
      throw new Error(
        `No Lemon Squeezy variant configured for plan "${planName}". Set LS_VARIANT_${planName.toUpperCase()} in .env`,
      );
    }

    const payload = {
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            custom: {
              user_id: userId,
              plan_name: planName,
            },
            email: userEmail,
          },
          checkout_options: {
            embed: false,
            media: true,
            logo: true,
            desc: true,
            discount: true,
            dark: true,
            subscription_preview: true,
          },
          product_options: {
            enabled_variants: [parseInt(variantId)],
            redirect_url: `${this.appUrl}/subscription?upgraded=true`,
            receipt_link_url: `${this.appUrl}/subscription`,
            receipt_thank_you_note: 'Thank you for upgrading VultaCore!',
          },
          expires_at: null,
        },
        relationships: {
          store: {
            data: { type: 'stores', id: this.lsStoreId },
          },
          variant: {
            data: { type: 'variants', id: variantId },
          },
        },
      },
    };

    const response = await firstValueFrom(
      this.http.post('https://api.lemonsqueezy.com/v1/checkouts', payload, {
        headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
          Authorization: `Bearer ${this.lsApiKey}`,
        },
      }),
    );

    const checkoutUrl: string =
      response.data?.data?.attributes?.url;

    if (!checkoutUrl) {
      throw new Error('Lemon Squeezy did not return a checkout URL.');
    }

    this.logger.log(`🛒 Checkout created for user ${userId} → ${checkoutUrl}`);
    return checkoutUrl;
  }

  /**
   * Verifies the Lemon Squeezy webhook signature and processes the event.
   */
  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    // 1. Verify HMAC-SHA256 signature
    const hmac = crypto.createHmac('sha256', this.lsWebhookSecret);
    hmac.update(rawBody);
    const digest = hmac.digest('hex');

    if (digest !== signature) {
      this.logger.warn('❌ Webhook signature mismatch — ignoring.');
      throw new Error('Invalid webhook signature');
    }

    const event = JSON.parse(rawBody.toString());
    const eventName: string = event?.meta?.event_name;
    const customData = event?.meta?.custom_data;
    const variantId: string = String(
      event?.data?.attributes?.variant_id ?? '',
    );

    this.logger.log(`📩 Lemon Squeezy webhook: ${eventName}`);

    if (
      eventName === 'order_created' ||
      eventName === 'subscription_payment_success' ||
      eventName === 'subscription_created'
    ) {
      const userId: string = customData?.user_id;
      const planName: string =
        customData?.plan_name ?? this.variantToPlan[variantId] ?? 'Standard';

      if (!userId) {
        this.logger.warn('Webhook missing user_id in custom_data');
        return;
      }

      // 2. Update user plan in DB
      await this.usersService.updatePlan(userId, planName);
      this.logger.log(`✅ Plan updated: user=${userId} plan=${planName}`);

      // 3. Push real-time update via WebSocket
      this.eventsGateway.emitSubscriptionUpdated(userId, planName);
    }
  }
}
