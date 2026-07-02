"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var BillingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
const crypto = __importStar(require("crypto"));
const users_service_1 = require("../users/users.service");
const events_gateway_1 = require("../events/events.gateway");
const plans_service_1 = require("../plans/plans.service");
let BillingService = BillingService_1 = class BillingService {
    http;
    config;
    usersService;
    eventsGateway;
    plansService;
    logger = new common_1.Logger(BillingService_1.name);
    lsApiKey;
    lsStoreId;
    lsWebhookSecret;
    appUrl;
    constructor(http, config, usersService, eventsGateway, plansService) {
        this.http = http;
        this.config = config;
        this.usersService = usersService;
        this.eventsGateway = eventsGateway;
        this.plansService = plansService;
        this.lsApiKey = this.config.get('LS_API_KEY', '');
        this.lsStoreId = this.config.get('LS_STORE_ID', '');
        this.lsWebhookSecret = this.config.get('LS_WEBHOOK_SECRET', '');
        this.appUrl = this.config.get('APP_URL', 'http://localhost:3000');
    }
    async createCheckoutSession(planId, userId, userEmail) {
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
        const response = await (0, rxjs_1.firstValueFrom)(this.http.post('https://api.lemonsqueezy.com/v1/checkouts', payload, {
            headers: {
                Accept: 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json',
                Authorization: `Bearer ${this.lsApiKey}`,
            },
        }));
        const typedResponse = response;
        const checkoutUrl = typedResponse?.data?.data?.attributes?.url;
        if (typeof checkoutUrl !== 'string' || !checkoutUrl) {
            throw new Error('Lemon Squeezy did not return a checkout URL.');
        }
        this.logger.log(`🛒 Checkout created for user ${userId} → ${checkoutUrl}`);
        return checkoutUrl;
    }
    async handleWebhook(rawBody, signature) {
        const hmac = crypto.createHmac('sha256', this.lsWebhookSecret);
        hmac.update(rawBody);
        const digest = hmac.digest('hex');
        if (digest !== signature) {
            this.logger.warn('❌ Webhook signature mismatch — ignoring.');
            throw new Error('Invalid webhook signature');
        }
        const parsed = JSON.parse(rawBody.toString());
        const event = parsed;
        const eventName = event?.meta?.event_name;
        const customData = event?.meta?.custom_data;
        const variantIdRaw = event?.data?.attributes?.variant_id;
        const variantId = variantIdRaw !== undefined && variantIdRaw !== null
            ? String(variantIdRaw)
            : '';
        this.logger.log(`📩 Lemon Squeezy webhook: ${eventName}`);
        if (eventName !== 'order_created' &&
            eventName !== 'subscription_payment_success' &&
            eventName !== 'subscription_created') {
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
        const resolvedPlanName = planFromVariant?.name ?? planNameFromWebhook ?? 'Free';
        await this.usersService.updatePlan(userId, resolvedPlanName);
        this.logger.log(`✅ Plan updated: user=${userId} plan=${resolvedPlanName}`);
        this.eventsGateway.emitSubscriptionUpdated(userId, resolvedPlanName);
    }
};
exports.BillingService = BillingService;
exports.BillingService = BillingService = BillingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService,
        users_service_1.UsersService,
        events_gateway_1.EventsGateway,
        plans_service_1.PlansService])
], BillingService);
//# sourceMappingURL=billing.service.js.map