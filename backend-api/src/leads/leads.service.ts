import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from './entities/lead.entity';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private leadsRepository: Repository<Lead>,
  ) {}

  create(leadData: Partial<Lead>): Promise<Lead> {
    const lead = this.leadsRepository.create(leadData);
    return this.leadsRepository.save(lead);
  }

  findAll(): Promise<Lead[]> {
    return this.leadsRepository.find({ order: { createdAt: 'DESC' } });
  }
}
