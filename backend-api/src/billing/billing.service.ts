import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { EventsGateway } from '../events/events.gateway';
import { PlansService } from '../plans/plans.service';

type LemonWebhookEvent = {
  meta?: {
    event_name?: string;
    custom_data?: {
      user_id?: string;
      plan_name?: string;
    };
  };
  data?: {
    attributes?: {
      variant_id?: string | number;
    };
  };
};

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly lsApiKey: string;
  private readonly lsStoreId: string;
  private readonly lsWebhookSecret: string;
  private readonly appUrl: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
    private readonly eventsGateway: EventsGateway,
    private readonly plansService: PlansService,
  ) {
    this.lsApiKey = this.config.get<string>('LS_API_KEY', '');
    this.lsStoreId = this.config.get<string>('LS_STORE_ID', '');
    this.lsWebhookSecret = this.config.get<string>('LS_WEBHOOK_SECRET', '');
    this.appUrl = this.config.get<string>('APP_URL', 'http://localhost:3000');
  }

  async createCheckoutSession(
    planId: string,
    userId: string,
    userEmail: string,
  ): Promise<string> {
    const plan = await this.plansService.findOne(planId);
    const variantId = plan.variantId;

    const payload = {
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            custom: {
              user_id: userId,
              plan_name: plan.name,
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
            enabled_variants: [parseInt(variantId, 10)],
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

    type CheckoutResponse = {
      data?: { data?: { attributes?: { url?: unknown } } };
    };

    const typedResponse = response as unknown as CheckoutResponse;
    const checkoutUrl: unknown = typedResponse?.data?.data?.attributes?.url;

    if (typeof checkoutUrl !== 'string' || !checkoutUrl) {
      throw new Error('Lemon Squeezy did not return a checkout URL.');
    }

    this.logger.log(`🛒 Checkout created for user ${userId} → ${checkoutUrl}`);
    return checkoutUrl;
  }

  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    const hmac = crypto.createHmac('sha256', this.lsWebhookSecret);
    hmac.update(rawBody);
    const digest = hmac.digest('hex');

    if (digest !== signature) {
      this.logger.warn('❌ Webhook signature mismatch — ignoring.');
      throw new Error('Invalid webhook signature');
    }

    const parsed: unknown = JSON.parse(rawBody.toString());
    const event = parsed as LemonWebhookEvent;

    const eventName = event?.meta?.event_name;
    const customData = event?.meta?.custom_data;
    const variantIdRaw = event?.data?.attributes?.variant_id;
    const variantId =
      variantIdRaw !== undefined && variantIdRaw !== null
        ? String(variantIdRaw)
        : '';

    this.logger.log(`📩 Lemon Squeezy webhook: ${eventName}`);

    if (
      eventName !== 'order_created' &&
      eventName !== 'subscription_payment_success' &&
      eventName !== 'subscription_created'
    ) {
      return;
    }

    const userId = customData?.user_id;
    const planNameFromWebhook = customData?.plan_name;

    if (!userId) {
      this.logger.warn('Webhook missing user_id in custom_data');
      return;
    }

    const planFromVariant = variantId
      ? await this.plansService.findByVariantId(variantId)
      : null;

    const resolvedPlanName =
      planFromVariant?.name ?? planNameFromWebhook ?? 'Free';

    await this.usersService.updatePlan(userId, resolvedPlanName);
    this.logger.log(`✅ Plan updated: user=${userId} plan=${resolvedPlanName}`);

    this.eventsGateway.emitSubscriptionUpdated(userId, resolvedPlanName);
  }
}
