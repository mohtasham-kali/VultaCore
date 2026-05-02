import { Repository } from 'typeorm';
import { Bot } from './entities/bot.entity';
import { HttpService } from '@nestjs/axios';
export declare class BotsService {
    private botsRepository;
    private readonly httpService;
    constructor(botsRepository: Repository<Bot>, httpService: HttpService);
    findAll(type?: 'general' | 'cyber'): Promise<Bot[]>;
    executeBot(id: string, prompt: string, userId: string, context?: string): Promise<any>;
    updateStatus(id: string, status: 'idle' | 'working' | 'completed'): Promise<Bot | null>;
    create(botData: Partial<Bot>): Promise<Bot>;
    seed(): Promise<void>;
}
