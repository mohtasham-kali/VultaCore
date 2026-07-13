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
const conversation_message_entity_1 = require("./entities/conversation-message.entity");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let BotsService = class BotsService {
    botsRepository;
    conversationRepository;
    httpService;
    constructor(botsRepository, conversationRepository, httpService) {
        this.botsRepository = botsRepository;
        this.conversationRepository = conversationRepository;
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
        const history = await this.conversationRepository.find({
            where: { botId: id, userId },
            order: { createdAt: 'DESC' },
            take: 10,
        });
        const orderedHistory = history.reverse();
        let memoryContext = '';
        if (orderedHistory.length > 0) {
            memoryContext =
                'Conversation History:\n' +
                    orderedHistory
                        .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
                        .join('\n') +
                    '\n\n';
        }
        const finalContext = memoryContext + (context ? `User Context/File:\n${context}` : '');
        bot.status = 'working';
        await this.botsRepository.save(bot);
        try {
            let aiServiceUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
            if (!aiServiceUrl.startsWith('http://') &&
                !aiServiceUrl.startsWith('https://')) {
                aiServiceUrl = `http://${aiServiceUrl}`;
            }
            console.log(`Executing bot ${bot.name} for user ${userId}...`);
            console.log(`Resolved AI_SERVICE_URL: ${aiServiceUrl}`);
            try {
                const healthRes = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${aiServiceUrl}/`));
                console.log('AI service base health:', healthRes.data);
            }
            catch (healthErr) {
                let debugMsg;
                if (healthErr instanceof Error) {
                    debugMsg = healthErr.message;
                }
                else if (typeof healthErr === 'object' &&
                    healthErr !== null &&
                    'response' in healthErr) {
                    const err = healthErr;
                    debugMsg =
                        err.response?.data?.detail ||
                            err.response?.data?.error ||
                            'Unknown AI service connectivity error';
                }
                else {
                    debugMsg = 'Unknown AI service connectivity error';
                }
                throw new Error(`AI service not reachable at ${aiServiceUrl}/: ${debugMsg}`);
            }
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${aiServiceUrl}/execute`, {
                prompt,
                user_id: userId,
                bot_type: bot.type,
                bot_name: bot.name,
                context: finalContext || null,
            }));
            bot.status = 'completed';
            await this.botsRepository.save(bot);
            await this.conversationRepository.save({
                userId,
                botId: id,
                role: 'user',
                content: prompt,
            });
            await this.conversationRepository.save({
                userId,
                botId: id,
                role: 'assistant',
                content: response.data.response || JSON.stringify(response.data),
            });
            return response.data;
        }
        catch (error) {
            bot.status = 'idle';
            await this.botsRepository.save(bot);
            let debugMsg;
            if (error instanceof Error) {
                debugMsg = error.message;
            }
            else if (typeof error === 'object' &&
                error !== null &&
                'response' in error) {
                const err = error;
                debugMsg =
                    (typeof err.response?.data?.detail === 'string'
                        ? err.response.data.detail
                        : null) ||
                        (typeof err.response?.data?.error === 'string'
                            ? err.response.data.error
                            : null) ||
                        (typeof err.message === 'string' ? err.message : null) ||
                        (typeof err.code === 'string' ? err.code : null) ||
                        JSON.stringify(error);
            }
            else {
                debugMsg = JSON.stringify(error);
            }
            console.error(`AI Service Error (${bot.name}):`, debugMsg);
            if (typeof error === 'object' && error !== null && 'response' in error) {
                const errorResponse = error.response;
                if (typeof errorResponse === 'object' &&
                    errorResponse !== null &&
                    'data' in errorResponse) {
                    console.error('Response data:', errorResponse.data);
                }
            }
            return { error: `AI Service communication failed: ${debugMsg}` };
        }
    }
    async getHistory(botId, userId) {
        const history = await this.conversationRepository.find({
            where: { botId, userId },
            order: { createdAt: 'ASC' },
            take: 50,
        });
        return history;
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
            {
                name: 'Text to Code',
                type: 'general',
                category: 'Code Tools',
                description: 'Convert natural language descriptions into executable code.',
            },
            {
                name: 'Image to Code',
                type: 'general',
                category: 'Code Tools',
                description: 'Generate code from UI mockups or screenshots.',
            },
            {
                name: 'Error Explainer',
                type: 'general',
                category: 'Analysis',
                description: 'Detailed explanation of compiler or runtime errors.',
            },
            {
                name: 'Bug Fixer',
                type: 'general',
                category: 'Analysis',
                description: 'Identify and resolve logic bugs or syntax issues.',
            },
            {
                name: 'Vulnerability Detection',
                type: 'cyber',
                category: 'Security Audit',
                description: 'Scan code for common security vulnerabilities (OWASP Top 10).',
            },
            {
                name: 'Have I Been Pwned',
                type: 'cyber',
                category: 'Threat Intel',
                description: 'Check if credentials have been compromised in known data breaches.',
            },
        ];
        for (const botData of bots) {
            const existing = await this.botsRepository.findOneBy({
                name: botData.name,
            });
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
    __param(1, (0, typeorm_1.InjectRepository)(conversation_message_entity_1.ConversationMessage)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        axios_1.HttpService])
], BotsService);
//# sourceMappingURL=bots.service.js.map