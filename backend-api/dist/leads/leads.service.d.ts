import { Repository } from 'typeorm';
import { Lead } from './entities/lead.entity';
export declare class LeadsService {
    private leadsRepository;
    constructor(leadsRepository: Repository<Lead>);
    create(leadData: Partial<Lead>): Promise<Lead>;
    findAll(): Promise<Lead[]>;
}
