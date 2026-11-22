import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnterpriseInquiry } from './entities/enterprise-inquiry.entity';
import { EnterpriseInquiryDto } from './dto/plans.dto';

@Injectable()
export class EnterpriseService {
  private readonly logger = new Logger(EnterpriseService.name);

  constructor(
    @InjectRepository(EnterpriseInquiry)
    private readonly inquiryRepo: Repository<EnterpriseInquiry>,
  ) {}

  private generateReference(): string {
    const random = Math.floor(1000 + Math.random() * 9000);
    const year = new Date().getFullYear();
    return `ENT-${year}-${random}`;
  }

  async createInquiry(dto: EnterpriseInquiryDto): Promise<EnterpriseInquiry> {
    const reference = this.generateReference();
    const inquiry: EnterpriseInquiry = this.inquiryRepo.create({
      reference,
      userId: dto.userId || null,
      fullName: dto.fullName,
      companyName: dto.companyName,
      email: dto.email,
      phone: dto.phone || '',
      requestedFeatures: JSON.stringify(dto.requestedFeatures || []),
      numberOfUsers: dto.numberOfUsers || '1-10',
      expectedUsage: dto.expectedUsage || null,
      customRequirements: dto.customRequirements || null,
      additionalMessage: dto.additionalMessage || null,
      status: 'new',
      adminNotes: null,
    });

    const saved = await this.inquiryRepo.save(inquiry);
    this.logger.log(`Created Enterprise Inquiry ${saved.reference} for ${saved.email}`);
    return saved;
  }

  async findAll(status?: string): Promise<EnterpriseInquiry[]> {
    const query = this.inquiryRepo.createQueryBuilder('inquiry').orderBy('inquiry.createdAt', 'DESC');
    if (status && status !== 'ALL') {
      query.where('inquiry.status = :status', { status });
    }
    return query.getMany();
  }

  async findOne(id: string): Promise<EnterpriseInquiry> {
    const inquiry = await this.inquiryRepo.findOne({ where: { id } });
    if (!inquiry) {
      throw new NotFoundException(`Inquiry with ID "${id}" not found`);
    }
    return inquiry;
  }

  async findByEmailOrUser(email: string, userId?: string): Promise<EnterpriseInquiry | null> {
    if (userId) {
      const byUser = await this.inquiryRepo.findOne({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
      if (byUser) return byUser;
    }
    return this.inquiryRepo.findOne({
      where: { email },
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(id: string, status: string, notes?: string): Promise<EnterpriseInquiry> {
    const inquiry = await this.findOne(id);
    inquiry.status = status;
    if (notes !== undefined) {
      inquiry.adminNotes = notes;
    }
    return this.inquiryRepo.save(inquiry);
  }
}
