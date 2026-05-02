import { LeadsService } from './leads.service';
import { Lead } from './entities/lead.entity';
export declare class LeadsController {
    private leadsService;
    constructor(leadsService: LeadsService);
    create(leadData: Partial<Lead>): Promise<Lead>;
    findAll(): Promise<Lead[]>;
}
