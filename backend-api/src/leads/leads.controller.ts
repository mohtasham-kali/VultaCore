import { Body, Controller, Get, Post } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { Lead } from './entities/lead.entity';

@Controller('leads')
export class LeadsController {
  constructor(private leadsService: LeadsService) {}

  @Post()
  create(@Body() leadData: Partial<Lead>) {
    return this.leadsService.create(leadData);
  }

  @Get()
  findAll() {
    return this.leadsService.findAll();
  }
}
