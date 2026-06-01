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
exports.BotsController = void 0;
const common_1 = require("@nestjs/common");
const bots_service_1 = require("./bots.service");
let BotsController = class BotsController {
    botsService;
    constructor(botsService) {
        this.botsService = botsService;
    }
    findAll(type) {
        return this.botsService.findAll(type);
    }
    execute(id, prompt, userId, context) {
        return this.botsService.executeBot(id, prompt, userId, context);
    }
    getHistory(id, userId) {
        if (!userId) {
            return [];
        }
        return this.botsService.getHistory(id, userId);
    }
    seed() {
        return this.botsService.seed();
    }
};
exports.BotsController = BotsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BotsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(':id/execute'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('prompt')),
    __param(2, (0, common_1.Body)('userId')),
    __param(3, (0, common_1.Body)('context')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], BotsController.prototype, "execute", null);
__decorate([
    (0, common_1.Get)(':id/history'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], BotsController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Post)('seed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BotsController.prototype, "seed", null);
exports.BotsController = BotsController = __decorate([
    (0, common_1.Controller)('bots'),
    __metadata("design:paramtypes", [bots_service_1.BotsService])
], BotsController);
//# sourceMappingURL=bots.controller.js.map