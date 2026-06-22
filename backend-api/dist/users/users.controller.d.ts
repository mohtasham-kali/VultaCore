import { UsersService } from './users.service';
import { PlanGuardService } from '../common/plan-guard.service';
export declare class UsersController {
    private usersService;
    private planGuard;
    constructor(usersService: UsersService, planGuard: PlanGuardService);
    findAll(): Promise<import("./entities/user.entity").User[]>;
    findOne(id: string): Promise<import("./entities/user.entity").User | null>;
    updatePlan(id: string, plan: string): Promise<import("./entities/user.entity").User>;
    getPlanInfo(id: string): Promise<{
        tier: string;
        limits: import("../common/plan-limits").PlanLimits;
        usage: {
            aiChatsToday: number;
            aiChatsLimit: number | "unlimited";
            aiChatsRemaining: string | number;
        };
    }>;
}
