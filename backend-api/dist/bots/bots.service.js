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
exports.BotsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bot_entity_1 = require("./entities/bot.entity");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let BotsService = class BotsService {
    botsRepository;
    httpService;
    constructor(botsRepository, httpService) {
        this.botsRepository = botsRepository;
        this.httpService = httpService;
    }
    findAll(type) {
        if (type) {
            return this.botsRepository.find({ where: { type } });
        }
        return this.botsRepository.find();
    }
    async executeBot(id, prompt, userId, context) {
        const bot = await this.botsRepository.findOneBy({ id });
        if (!bot)
            return { error: 'Bot not found' };
        bot.status = 'working';
        await this.botsRepository.save(bot);
        try {
            console.log(`Executing bot ${bot.name} for user ${userId}...`);
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post('http://localhost:8000/execute', {
                prompt,
                user_id: userId,
                bot_type: bot.type,
                bot_name: bot.name,
                context: context || null
            }));
            bot.status = 'completed';
            await this.botsRepository.save(bot);
            return response.data;
        }
        catch (error) {
            bot.status = 'idle';
            await this.botsRepository.save(bot);
            console.error(`AI Service Error (${bot.name}):`, error.message);
            if (error.response) {
                console.error('Response data:', error.response.data);
            }
            return { error: 'AI Service communication failed: ' + (error.message || 'Unknown error') };
        }
    }
    async updateStatus(id, status) {
        const bot = await this.botsRepository.findOneBy({ id });
        if (bot) {
            bot.status = status;
            return this.botsRepository.save(bot);
        }
        return null;
    }
    create(botData) {
        const bot = this.botsRepository.create(botData);
        return this.botsRepository.save(bot);
    }
    async seed() {
        const bots = [
            { name: 'Text to Code', type: 'general', category: 'Code Tools', description: 'Convert natural language descriptions into executable code.' },
            { name: 'Image to Code', type: 'general', category: 'Code Tools', description: 'Generate code from UI mockups or screenshots.' },
            { name: 'Error Explainer', type: 'general', category: 'Analysis', description: 'Detailed explanation of compiler or runtime errors.' },
            { name: 'Bug Fixer', type: 'general', category: 'Analysis', description: 'Identify and resolve logic bugs or syntax issues.' },
            { name: 'Vulnerability Detection', type: 'cyber', category: 'Security Audit', description: 'Scan code for common security vulnerabilities (OWASP Top 10).' },
            { name: 'Have I Been Pwned', type: 'cyber', category: 'Threat Intel', description: 'Check if credentials have been compromised in known data breaches.' },
        ];
        for (const botData of bots) {
            const existing = await this.botsRepository.findOneBy({ name: botData.name });
            if (!existing) {
                await this.create(botData);
            }
        }
    }
};
exports.BotsService = BotsService;
exports.BotsService = BotsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(bot_entity_1.Bot)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        axios_1.HttpService])
], BotsService);
//# sourceMappingURL=bots.service.js.map