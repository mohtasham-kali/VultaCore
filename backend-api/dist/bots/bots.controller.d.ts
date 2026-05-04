import { BotsService } from './bots.service';
export declare class BotsController {
    private readonly botsService;
    constructor(botsService: BotsService);
    findAll(type?: 'general' | 'cyber'): Promise<import("./entities/bot.entity").Bot[]>;
    execute(id: string, prompt: string, userId: string, context?: string): Promise<any>;
    seed(): Promise<void>;
}
