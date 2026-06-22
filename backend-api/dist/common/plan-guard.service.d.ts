import { UsersService } from '../users/users.service';
export declare class PlanGuardService {
    private readonly usersService;
    private aiUsage;
    private securityHubUsage;
    constructor(usersService: UsersService);
    private todayDate;
    checkAiChatLimit(userId: string): Promise<{
        allowed: boolean;
        remaining: number | 'unlimited';
        limit: number | 'unlimited';
        tier: string;
    }>;
    incrementAiUsage(userId: string): void;
    checkSecurityHubLimit(userId: string): Promise<{
        allowed: boolean;
        remaining: number | 'unlimited';
        limit: number | 'unlimited';
        tier: string;
    }>;
    incrementSecurityHubUsage(userId: string): void;
    getAllowedModels(userId: string): Promise<string[]>;
    canUseApi(userId: string): Promise<boolean>;
    canAccessSecurityHub(userId: string): Promise<boolean>;
    getPlanInfo(userId: string): Promise<{
        tier: string;
        limits: import("./plan-limits").PlanLimits;
        usage: {
            aiChatsToday: number;
            aiChatsLimit: number | "unlimited";
            aiChatsRemaining: string | number;
        };
    }>;
}
