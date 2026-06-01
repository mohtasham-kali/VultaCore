import { Repository } from 'typeorm';
import { Bot } from './entities/bot.entity';
import { ConversationMessage } from './entities/conversation-message.entity';
import { HttpService } from '@nestjs/axios';
export declare class BotsService {
    private botsRepository;
    private conversationRepository;
    private readonly httpService;
    constructor(botsRepository: Repository<Bot>, conversationRepository: Repository<ConversationMessage>, httpService: HttpService);
    findAll(type?: 'general' | 'cyber'): Promise<Bot[]>;
    executeBot(id: string, prompt: string, userId: string, context?: string): Promise<any>;
    getHistory(botId: string, userId: string): Promise<ConversationMessage[]>;
    updateStatus(id: string, status: 'idle' | 'working' | 'completed'): Promise<Bot | null>;
    create(botData: Partial<Bot>): Promise<Bot>;
    seed(): Promise<void>;
}
