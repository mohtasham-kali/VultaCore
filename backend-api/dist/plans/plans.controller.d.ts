import { PlansService, type CreatePlanDto, type UpdatePlanDto } from './plans.service';
export declare class PlansController {
    private readonly plansService;
    constructor(plansService: PlansService);
    findAll(): Promise<import("./entities/plan.entity").Plan[]>;
    create(dto: CreatePlanDto): Promise<import("./entities/plan.entity").Plan>;
    update(id: string, dto: UpdatePlanDto): Promise<import("./entities/plan.entity").Plan>;
    remove(id: string): Promise<void>;
}
