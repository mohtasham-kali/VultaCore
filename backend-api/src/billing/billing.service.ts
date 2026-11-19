import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Paddle, Environment } from '@paddle/paddle-node-sdk';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { EventsGateway } from '../events/events.gateway';

/**
 * Maps Paddle sandbox price IDs → plan names.
 */
const SANDBOX_PRICE_TO_PLAN: Record<string, string> = {
  // Standard — monthly & annual
  pri_01m7r41d01n8xa18z8kzwhchv1: 'Standard',
  pri_01m7r41d7yphdthpr9jhkw3b00: 'Standard',
  // Premium — monthly & annual
  pri_01m7r41dwfzw108seb2ptyvzrh: 'Premium',
  pri_01m7r41e4p5a3w63m65b6ewd05: 'Premium',
  // Enterprise
  pri_01m7r41epjb34524nsn3nebdym: 'Enterprise',
  pri_01m7r41eyvfc4x09tr8dv3nmtm: 'Enterprise',
  // Free
  pri_01m7r6d5fzz6397fsw4c5a3xx4: 'Free',
};

/**
 * Maps Paddle live price IDs → plan names.
 */
const LIVE_PRICE_TO_PLAN: Record<string, string> = {
  pri_01m7r11zk5c3bma7a6k0y70g5n: 'Standard', // live monthly
  pri_01m7r12e4rwbrt25331y3sm88p: 'Premium',   // live monthly
};

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly paddle: Paddle;
  private readonly webhookSecret: string;
  private readonly appUrl: string;
  private readonly environment: Environment;
  private readonly priceToPlan: Record<string, string>;
  private readonly planToPrice: Record<string, string>;

  constructor(
    private readonly config: ConfigService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly eventsGateway: EventsGateway,
  ) {
    const explicitEnv =
      this.config.get<string>('PADDLE_ENV') || process.env.PADDLE_ENV || '';

    const sandboxKey =
      this.config.get<string>('PADDLE_SANDBOX_API_KEY') ||
      process.env.PADDLE_SANDBOX_API_KEY ||
      '';

    let apiKey =
      this.config.get<string>('PADDLE_API_KEY') ||
      process.env.PADDLE_API_KEY ||
      '';

    // If explicitEnv is sandbox or if key is empty, prefer the sandbox key
    if (explicitEnv.toLowerCase() === 'sandbox' && sandboxKey) {
      apiKey = sandboxKey;
    } else if (!apiKey && sandboxKey) {
      apiKey = sandboxKey;
    }

    // Automatically synchronize Environment with the API key prefix
    // (pdl_live_* requires Environment.production, pdl_sdbx_* requires Environment.sandbox)
    if (apiKey.startsWith('pdl_live_')) {
      this.environment = Environment.production;
    } else {
      this.environment = Environment.sandbox;
    }

    this.logger.log(
      `Paddle initialized in [${this.environment}] mode with key: ${apiKey.slice(0, 15)}...`,
    );

    // Map plans to appropriate prices for the active environment
    if (this.environment === Environment.production) {
      this.priceToPlan = { ...LIVE_PRICE_TO_PLAN };
      this.planToPrice = {
        Standard: 'pri_01m7r11zk5c3bma7a6k0y70g5n',
        Premium: 'pri_01m7r12e4rwbrt25331y3sm88p',
      };
    } else {
      this.priceToPlan = { ...SANDBOX_PRICE_TO_PLAN };
      this.planToPrice = {
        Standard: 'pri_01m7r41d01n8xa18z8kzwhchv1',
        Premium: 'pri_01m7r41dwfzw108seb2ptyvzrh',
        Enterprise: 'pri_01m7r41epjb34524nsn3nebdym',
      };
    }

    // Allow price IDs to be injected via env as JSON: PADDLE_PRICE_MAP='{"pri_xxx":"Standard"}'
    const extraMapRaw =
      this.config.get<string>('PADDLE_PRICE_MAP') || process.env.PADDLE_PRICE_MAP;
    if (extraMapRaw) {
      try {
        const extra = JSON.parse(extraMapRaw) as Record<string, string>;
        Object.assign(this.priceToPlan, extra);
        Object.assign(
          this.planToPrice,
          Object.fromEntries(Object.entries(extra).map(([k, v]) => [v, k])),
        );
      } catch {
        this.logger.warn('PADDLE_PRICE_MAP is not valid JSON — ignoring');
      }
    }

    this.webhookSecret =
      this.config.get<string>('PADDLE_WEBHOOK_SECRET') ||
      process.env.PADDLE_WEBHOOK_SECRET ||
      '';

    this.appUrl =
      this.config.get<string>('APP_URL') ||
      process.env.APP_URL ||
      'https://vultacore.techprogression.com';

    this.paddle = new Paddle(apiKey || 'missing', { environment: this.environment });
  }

  /**
   * Creates a Paddle transaction (hosted checkout) and returns the checkout URL.
   *
   * POST /billing/checkout
   * Body: { planName, userId, userEmail }
   */
  async createCheckoutSession(
    planName: string,
    userId: string,
    userEmail: string,
  ): Promise<string> {
    if (planName.toLowerCase() === 'enterprise') {
      // Enterprise is contact-sales only — redirect to compose email to sales@techprogression.com
      const subject = encodeURIComponent(`Enterprise Plan Inquiry - ${userEmail || 'VultaCore'}`);
      const body = encodeURIComponent(
        `Hi TechProgression Sales Team,\n\nI would like to inquire about the Enterprise Plan for my account.\n\nAccount Details:\n- Email: ${userEmail}\n- User ID: ${userId}\n- Requested Tier: Enterprise\n\nPlease get in touch regarding custom contract setup and provisioning.\n\nThank you!`,
      );
      return `mailto:sales@techprogression.com?subject=${subject}&body=${body}`;
    }

    const priceId = this.planToPrice[planName];
    if (!priceId) {
      throw new Error(
        `No Paddle price configured for plan "${planName}". ` +
        `Add it to planToPrice in billing.service.ts or set PADDLE_PRICE_MAP in .env.`,
      );
    }

    // Try to find or create customer to pre-fill their email on checkout (non-blocking)
    let customerId: string | undefined;
    if (userEmail) {
      try {
        const collection = this.paddle.customers.list({ email: [userEmail] });
        const existing = await collection.next();
        if (existing && existing.length > 0) {
          customerId = existing[0].id;
        } else {
          const created = await this.paddle.customers.create({ email: userEmail });
          customerId = created.id;
        }
      } catch (err: any) {
        this.logger.warn(`Customer lookup/create skipped: ${err?.message || err}`);
      }
    }

    try {
      const transaction = await this.paddle.transactions.create({
        items: [{ priceId, quantity: 1 }],
        customerId: customerId || undefined,
        customData: { user_id: userId, plan_name: planName },
        checkout: {
          url: `${this.appUrl}/subscription?upgraded=true`,
        },
      });

      const checkoutUrl = transaction.checkout?.url;
      if (!checkoutUrl) {
        throw new Error('Paddle did not return a checkout URL.');
      }

      this.logger.log(
        `🛒 Paddle checkout created for user ${userId} plan=${planName} → ${checkoutUrl}`,
      );
      return checkoutUrl;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Paddle checkout error: ${msg}`);
      throw new Error(msg);
    }
  }

  /**
   * Verifies the Paddle webhook signature and handles billing events.
   *
   * POST /billing/webhook
   * Header: paddle-signature
   */
  async handleWebhook(rawBody: Buffer, signatureHeader: string): Promise<void> {
    if (!this.webhookSecret) {
      this.logger.warn(
        'PADDLE_WEBHOOK_SECRET is not set — skipping signature verification (unsafe in production!)',
      );
    }

    let event: any;
    try {
      event = await this.paddle.webhooks.unmarshal(
        rawBody.toString(),
        this.webhookSecret,
        signatureHeader,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`❌ Paddle webhook signature verification failed: ${msg}`);
      throw new Error('Invalid webhook signature');
    }

    const eventType: string = event?.eventType || '';
    this.logger.log(`📩 Paddle webhook: ${eventType}`);

    if (
      eventType === 'subscription.activated' ||
      eventType === 'subscription.created' ||
      eventType === 'transaction.completed'
    ) {
      await this.handleActivation(event);
    } else if (eventType === 'subscription.canceled') {
      await this.handleCancellation(event);
    } else if (eventType === 'subscription.updated') {
      await this.handleUpdate(event);
    }
  }

  // ─── Private event handlers ────────────────────────────────────────────────

  private async handleActivation(event: any): Promise<void> {
    const customData = event.data?.customData as Record<string, string> | null;
    const userId: string = customData?.user_id ?? '';
    if (!userId) {
      this.logger.warn(`[${event.eventType}] Missing user_id in customData — skipping`);
      return;
    }

    let planName = customData?.plan_name ?? '';
    if (!planName) {
      const items: any[] = event.data?.items ?? [];
      const priceId: string = items[0]?.price?.id ?? '';
      planName = this.priceToPlan[priceId] ?? 'Standard';
    }

    await this.usersService.updatePlan(userId, planName, false);
    this.logger.log(`✅ Plan activated: user=${userId} plan=${planName}`);
    this.eventsGateway.emitSubscriptionUpdated(userId, planName);
  }

  private async handleCancellation(event: any): Promise<void> {
    const customData = event.data?.customData as Record<string, string> | null;
    const userId: string = customData?.user_id ?? '';
    if (!userId) {
      this.logger.warn('[subscription.canceled] Missing user_id — skipping');
      return;
    }

    await this.usersService.updatePlan(userId, 'Free', false);
    this.logger.log(`🚫 Subscription canceled: user=${userId} → downgraded to Free`);
    this.eventsGateway.emitSubscriptionUpdated(userId, 'Free');
  }

  private async handleUpdate(event: any): Promise<void> {
    const customData = event.data?.customData as Record<string, string> | null;
    const userId: string = customData?.user_id ?? '';
    if (!userId) return;

    const items: any[] = event.data?.items ?? [];
    const priceId: string = items[0]?.price?.id ?? '';
    const planName = this.priceToPlan[priceId];
    if (!planName) {
      this.logger.debug(`[subscription.updated] Unknown priceId=${priceId} — skipping plan update`);
      return;
    }

    await this.usersService.updatePlan(userId, planName, false);
    this.logger.log(`🔄 Plan updated: user=${userId} plan=${planName}`);
    this.eventsGateway.emitSubscriptionUpdated(userId, planName);
  }

  /**
   * Synchronizes a user's plan assignment directly with Paddle.
   * - Finds or creates the customer in Paddle using their email.
   * - Updates customData on the customer record (plan_name, rank, assigned_by: admin).
   * - If an active or trialing Paddle subscription exists, upgrades the subscription item.
   * - Emits real-time websocket event to connected web clients.
   */
  async syncUserPlanToPaddle(
    user: User,
    planName: string,
  ): Promise<{ success: boolean; customerId?: string; subscriptionId?: string; message: string }> {
    try {
      this.logger.log(`Syncing plan "${planName}" to Paddle for user ${user.id} (${user.email})...`);

      // 1. Find or create customer in Paddle
      let customerId: string | undefined;
      try {
        const collection = this.paddle.customers.list({ email: [user.email] });
        const existing = await collection.next();

        if (existing && existing.length > 0) {
          customerId = existing[0].id;
          await this.paddle.customers.update(customerId, {
            name: user.username || undefined,
            customData: {
              user_id: user.id,
              plan_name: planName,
              rank: planName,
              updated_at: new Date().toISOString(),
              assigned_by: 'admin',
            },
          });
          this.logger.log(`Updated existing Paddle customer ${customerId} customData to plan: ${planName}`);
        } else {
          const created = await this.paddle.customers.create({
            email: user.email,
            name: user.username || user.email.split('@')[0],
            customData: {
              user_id: user.id,
              plan_name: planName,
              rank: planName,
              created_at: new Date().toISOString(),
              assigned_by: 'admin',
            },
          });
          customerId = created.id;
          this.logger.log(`Created new Paddle customer ${customerId} for ${user.email} with plan: ${planName}`);
        }
      } catch (custErr: any) {
        this.logger.warn(`Paddle customer sync warning: ${custErr?.message || custErr}`);
      }

      // 2. Check for active subscription and update if present
      let subscriptionId: string | undefined;
      if (customerId) {
        try {
          const subCollection = this.paddle.subscriptions.list({
            customerId: [customerId],
            status: ['active', 'trialing'],
          });
          const subs = await subCollection.next();
          if (subs && subs.length > 0) {
            const activeSub = subs[0];
            subscriptionId = activeSub.id;
            const targetPriceId = this.planToPrice[planName];
            if (targetPriceId) {
              await this.paddle.subscriptions.update(activeSub.id, {
                items: [{ priceId: targetPriceId, quantity: 1 }],
                prorationBillingMode: 'full_immediately',
              });
              this.logger.log(`Updated Paddle subscription ${activeSub.id} to price ${targetPriceId} (${planName})`);
            }
          }
        } catch (subErr: any) {
          this.logger.warn(`Paddle subscription update warning: ${subErr?.message || subErr}`);
        }
      }

      // 3. Emit real-time update to active clients via websocket
      this.eventsGateway.emitSubscriptionUpdated(user.id, planName);

      return {
        success: true,
        customerId,
        subscriptionId,
        message: `Successfully synchronized ${planName} tier to Paddle for ${user.email}`,
      };
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Error syncing plan to Paddle for user ${user.id}: ${msg}`);
      return {
        success: false,
        message: `Database updated, but Paddle sync encountered: ${msg}`,
      };
    }
  }
}
