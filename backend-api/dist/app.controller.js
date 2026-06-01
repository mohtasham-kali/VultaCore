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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const app_service_1 = require("./app.service");
const chat_gateway_1 = require("./chat/chat.gateway");
const users_service_1 = require("./users/users.service");
let AppController = class AppController {
    appService;
    chatGateway;
    usersService;
    constructor(appService, chatGateway, usersService) {
        this.appService = appService;
        this.chatGateway = chatGateway;
        this.usersService = usersService;
    }
    getHello() {
        return this.appService.getHello();
    }
    async handleRevenueCatWebhook(payload) {
        if (!payload?.event)
            return { status: 'ignored' };
        const appUserId = payload.event.app_user_id;
        const type = payload.event.type;
        const productId = payload.event.product_id;
        console.log(`[RevenueCat Webhook] User ${appUserId} triggered ${type} for ${productId}`);
        if (type === 'INITIAL_PURCHASE' || type === 'RENEWAL') {
            let rank = 'Free';
            if (productId.includes('standard'))
                rank = 'Standard';
            if (productId.includes('premium'))
                rank = 'Premium';
            await this.usersService.updatePlan(appUserId, rank);
            this.chatGateway.notifyUserSubscriptionUpdated(appUserId, rank);
        }
        return { status: 'success' };
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], AppController.prototype, "getHello", null);
__decorate([
    (0, common_1.Post)('webhooks/revenuecat'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "handleRevenueCatWebhook", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [app_service_1.AppService,
        chat_gateway_1.ChatGateway,
        users_service_1.UsersService])
], AppController);
//# sourceMappingURL=app.controller.js.map