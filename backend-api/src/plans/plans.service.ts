import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from './entities/plan.entity';

export interface CreatePlanDto {
  name: string;
  price: number;
  interval: string; // e.g. 'monthly' | 'yearly'
  features: string[];
  variantId: string; // Lemon Squeezy variant id
}

export interface UpdatePlanDto {
  name?: string;
  price?: number;
  interval?: string;
  features?: string[];
  variantId?: string;
}

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan)
    private readonly plansRepository: Repository<Plan>,
  ) {}

  findAll(): Promise<Plan[]> {
    return this.plansRepository.find();
  }

  async findOne(id: string): Promise<Plan> {
    const plan = await this.plansRepository.findOneBy({ id });
    if (!plan) throw new NotFoundException(`Plan ${id} not found`);
    return plan;
  }

  async findByName(name: string): Promise<Plan> {
    const plans = await this.plansRepository.find();
    const plan = plans.find((p) => p.name.toLowerCase() === name.toLowerCase());
    if (plan) return plan;

    const defaultVariant =
      name.toLowerCase() === 'standard'
        ? process.env.LS_VARIANT_STANDARD || '1820715'
        : name.toLowerCase() === 'premium'
        ? process.env.LS_VARIANT_PREMIUM || '1820708'
        : name.toLowerCase() === 'enterprise'
        ? process.env.LS_VARIANT_ENTERPRISE || '1860093'
        : 'free-tier';

    const defaultPrice =
      name.toLowerCase() === 'standard'
        ? 29
        : name.toLowerCase() === 'premium'
        ? 99
        : name.toLowerCase() === 'enterprise'
        ? 179
        : 0;

    return this.create({
      name,
      price: defaultPrice,
      interval: 'monthly',
      features: [`${name} tier access`],
      variantId: defaultVariant,
    });
  }

  async findByVariantId(variantId: string): Promise<Plan | null> {
    return this.plansRepository.findOneBy({ variantId });
  }

  async create(dto: CreatePlanDto): Promise<Plan> {
    const plan = this.plansRepository.create({
      name: dto.name,
      price: dto.price,
      interval: dto.interval,
      features: dto.features,
      variantId: dto.variantId,
    });
    return this.plansRepository.save(plan);
  }

  async update(id: string, dto: UpdatePlanDto): Promise<Plan> {
    const plan = await this.findOne(id);

    if (dto.name !== undefined) plan.name = dto.name;
    if (dto.price !== undefined) plan.price = dto.price;
    if (dto.interval !== undefined) plan.interval = dto.interval;
    if (dto.features !== undefined) plan.features = dto.features;
    if (dto.variantId !== undefined) plan.variantId = dto.variantId;

    return this.plansRepository.save(plan);
  }

  async remove(id: string): Promise<void> {
    const plan = await this.findOne(id);
    await this.plansRepository.remove(plan);
  }
}
