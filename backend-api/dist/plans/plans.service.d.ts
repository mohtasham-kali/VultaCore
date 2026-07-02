import { Repository } from 'typeorm';
import { Plan } from './entities/plan.entity';
export interface CreatePlanDto {
    name: string;
    price: number;
    interval: string;
    features: string[];
    variantId: string;
}
export interface UpdatePlanDto {
    name?: string;
    price?: number;
    interval?: string;
    features?: string[];
    variantId?: string;
}
export declare class PlansService {
    private readonly plansRepository;
    constructor(plansRepository: Repository<Plan>);
    findAll(): Promise<Plan[]>;
    findOne(id: string): Promise<Plan>;
    findByVariantId(variantId: string): Promise<Plan | null>;
    create(dto: CreatePlanDto): Promise<Plan>;
    update(id: string, dto: UpdatePlanDto): Promise<Plan>;
    remove(id: string): Promise<void>;
}
