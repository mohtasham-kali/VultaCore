import { BotsService } from './bots.service';
import { PlanGuardService } from '../common/plan-guard.service';
import { UsersService } from '../users/users.service';
export declare class BotsController {
    private readonly botsService;
    private readonly planGuard;
    private readonly usersService;
    constructor(botsService: BotsService, planGuard: PlanGuardService, usersService: UsersService);
    findAll(type?: 'general' | 'cyber'): Promise<import("./entities/bot.entity").Bot[]>;
    execute(id: string, prompt: string, userId: string, context?: string): Promise<any>;
    getHistory(id: string, userId: string): Promise<import("./entities/conversation-message.entity").ConversationMessage[]> | never[];
    seed(): Promise<void>;
}
