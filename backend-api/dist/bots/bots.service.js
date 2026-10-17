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
            memoryContext = 'Conversation History:\n' + orderedHistory.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n') + '\n\n';
        }
        const finalContext = memoryContext + (context ? `User Context/File:\n${context}` : '');
        bot.status = 'working';
        await this.botsRepository.save(bot);
        try {
            console.log(`Executing bot ${bot.name} for user ${userId}...`);
            const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
            const isSocket = typeof aiServiceUrl === 'string' && (aiServiceUrl.startsWith('/') || aiServiceUrl.endsWith('.sock') || aiServiceUrl.startsWith('unix:'));
            const socketPath = isSocket ? aiServiceUrl.replace(/^unix:\/\//, '').replace(/^unix:/, '') : undefined;
            const requestUrl = isSocket ? 'http://localhost/execute' : `${aiServiceUrl}/execute`;
            const requestConfig = socketPath ? { socketPath } : {};
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(requestUrl, {
                prompt,
                user_id: userId,
                bot_type: bot.type,
                bot_name: bot.name,
                context: finalContext || null
            }, requestConfig));
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
            const debugMsg = error?.response?.data?.detail
                || error?.response?.data?.error
                || error?.message
                || error?.code
                || JSON.stringify(error)
                || 'Unknown connection or parsing error';
            console.warn(`[BotsService] AI Microservice unavailable (${bot.name}): ${debugMsg}. Invoking direct cloud fallback...`);
            try {
                const fallbackData = await this.fallbackDirectCloud(bot, prompt, finalContext);
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
                    content: fallbackData.response || JSON.stringify(fallbackData),
                });
                return fallbackData;
            }
            catch (fallbackError) {
                bot.status = 'idle';
                await this.botsRepository.save(bot);
                console.error(`[BotsService] All AI engines failed (${bot.name}):`, fallbackError.message);
                return { error: `AI Service communication failed: ${debugMsg}. Fallback: ${fallbackError.message}` };
            }
        }
    }
    async fallbackDirectCloud(bot, prompt, context) {
        const startTime = Date.now();
        const systemRole = bot.type === 'cyber'
            ? 'You are an advanced Cyber Security AI Agent. Provide expert security analysis, threat mitigation, and code audit insights.'
            : bot.name === 'Text to Code'
                ? 'You are an expert software engineer. Write high-quality, robust, and clean code with clear explanations.'
                : bot.name === 'Bug Fixer'
                    ? 'You are a master debugging specialist. Analyze the problem, identify root causes, and provide working solutions.'
                    : 'You are an intelligent, helpful AI assistant built into VultaCore.';
        const fullPrompt = context
            ? `CONTEXT:\n${context}\n\nUSER REQUEST:\n${prompt}`
            : prompt;
        const openrouterKey = (process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API || '').trim();
        if (openrouterKey) {
            const models = ['openai/gpt-4o', 'meta-llama/llama-3.3-70b-instruct', 'google/gemini-2.0-flash-001'];
            for (const model of models) {
                try {
                    const res = await (0, rxjs_1.firstValueFrom)(this.httpService.post('https://openrouter.ai/api/v1/chat/completions', {
                        model,
                        messages: [
                            { role: 'system', content: systemRole },
                            { role: 'user', content: fullPrompt },
                        ],
                        max_tokens: 1000,
                    }, {
                        headers: {
                            Authorization: `Bearer ${openrouterKey}`,
                            'Content-Type': 'application/json',
                            'HTTP-Referer': 'https://vultacore.techprogression.com',
                            'X-Title': 'VultaCore SaaS',
                        },
                        timeout: 18000,
                    }));
                    const reply = res.data?.choices?.[0]?.message?.content;
                    if (reply) {
                        return {
                            bot_name: bot.name,
                            response: reply,
                            confidence: 0.96,
                            processing_time: (Date.now() - startTime) / 1000,
                            metadata: { engine: `${model} (Direct OpenRouter Fallback)` },
                        };
                    }
                }
                catch (e) {
                    console.warn(`[OpenRouter Direct Error] ${model}: ${e.message}`);
                }
            }
        }
        const geminiKey = (process.env.GEMINI_API_KEY || process.env.GEMINI_API || process.env.GENAI_API || '').trim();
        if (geminiKey) {
            const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
            for (const m of models) {
                try {
                    const res = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${geminiKey}`, {
                        contents: [
                            {
                                parts: [
                                    { text: `${systemRole}\n\n${fullPrompt}` }
                                ]
                            }
                        ]
                    }, {
                        headers: { 'Content-Type': 'application/json' },
                        timeout: 18000,
                    }));
                    const reply = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (reply) {
                        return {
                            bot_name: bot.name,
                            response: reply,
                            confidence: 0.95,
                            processing_time: (Date.now() - startTime) / 1000,
                            metadata: { engine: `${m} (Direct Gemini Fallback)` },
                        };
                    }
                }
                catch (e) {
                    console.warn(`[Gemini Direct Error] ${m}: ${e.message}`);
                }
            }
        }
        const groqKey = (process.env.GROQ_API_KEY || process.env.GROQ_API || '').trim();
        if (groqKey) {
            const models = ['openai/gpt-oss-120b', 'llama-3.3-70b-versatile'];
            for (const m of models) {
                try {
                    const res = await (0, rxjs_1.firstValueFrom)(this.httpService.post('https://api.groq.com/openai/v1/chat/completions', {
                        model: m,
                        messages: [
                            { role: 'system', content: systemRole },
                            { role: 'user', content: fullPrompt },
                        ],
                    }, {
                        headers: {
                            Authorization: `Bearer ${groqKey}`,
                            'Content-Type': 'application/json',
                        },
                        timeout: 18000,
                    }));
                    const reply = res.data?.choices?.[0]?.message?.content;
                    if (reply) {
                        return {
                            bot_name: bot.name,
                            response: reply,
                            confidence: 0.94,
                            processing_time: (Date.now() - startTime) / 1000,
                            metadata: { engine: `${m} (Direct Groq Fallback)` },
                        };
                    }
                }
                catch (e) {
                    console.warn(`[Groq Direct Error] ${m}: ${e.message}`);
                }
            }
        }
        throw new Error('All AI providers (OpenRouter, Gemini, Groq) failed or keys are missing.');
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
    __param(1, (0, typeorm_1.InjectRepository)(conversation_message_entity_1.ConversationMessage)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        axios_1.HttpService])
], BotsService);
//# sourceMappingURL=bots.service.js.map