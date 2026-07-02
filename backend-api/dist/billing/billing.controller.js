"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var BillingController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingController = void 0;
const common_1 = require("@nestjs/common");
const billing_service_1 = require("./billing.service");
let BillingController = BillingController_1 = class BillingController {
    billingService;
    logger = new common_1.Logger(BillingController_1.name);
    constructor(billingService) {
        this.billingService = billingService;
    }
    async createCheckout(body) {
        const { planId, userId, userEmail } = body;
        if (!planId || !userId || !userEmail) {
            throw new common_1.BadRequestException('planId, userId and userEmail are required.');
        }
        try {
            const url = await this.billingService.createCheckoutSession(planId, userId, userEmail);
            return { checkoutUrl: url };
        }
        catch (err) {
            const message = err.message;
            this.logger.error(`Checkout creation failed: ${message}`);
            throw new common_1.BadRequestException(message);
        }
    }
    async handleWebhook(req, signature) {
        const rawBody = req.rawBody;
        if (!rawBody) {
            throw new common_1.BadRequestException('No raw body found. Check middleware config.');
        }
        try {
            await this.billingService.handleWebhook(rawBody, signature);
            return { received: true };
        }
        catch (err) {
            const message = err.message;
            this.logger.error(`Webhook error: ${message}`);
            throw new common_1.BadRequestException(message);
        }
    }
};
exports.BillingController = BillingController;
__decorate([
    (0, common_1.Post)('checkout'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "createCheckout", null);
__decorate([
    (0, common_1.Post)('webhook'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('x-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "handleWebhook", null);
exports.BillingController = BillingController = BillingController_1 = __decorate([
    (0, common_1.Controller)('billing'),
    __metadata("design:paramtypes", [billing_service_1.BillingService])
], BillingController);
//# sourceMappingURL=billing.controller.js.map