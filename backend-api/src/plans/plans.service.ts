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
