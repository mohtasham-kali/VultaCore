import { Injectable, Logger, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feature } from './entities/feature.entity';
import { CreateFeatureDto, UpdateFeatureDto } from './dto/plans.dto';

export const INITIAL_FEATURES = [
  // Community
  {
    key: 'community_forum',
    name: 'Community Forum Access',
    description: 'Access to public developer discussion boards, Q&A, and community threads.',
    category: 'community',
    type: 'boolean',
    defaultLimit: null,
  },
  {
    key: 'standard_support',
    name: 'Standard Support',
    description: 'Community-based support with regular response turnaround times.',
    category: 'community',
    type: 'boolean',
    defaultLimit: null,
  },
  {
    key: 'priority_forum_support',
    name: 'Priority Forum Support',
    description: 'Fast-track engineering response and verified developer badges in the forum.',
    category: 'community',
    type: 'boolean',
    defaultLimit: null,
  },
  // AI
  {
    key: 'basic_ai_chat',
    name: 'Basic AI Chat',
    description: 'General-purpose AI assistance powered by open-source high-throughput models.',
    category: 'ai',
    type: 'quota',
    defaultLimit: 5,
    metadata: JSON.stringify({ models: ['llama-3.1-8b-instant'] }),
  },
  {
    key: 'gemini_pro',
    name: 'Pro AI Engine (Gemini)',
    description: 'High-reasoning code analysis, debugging, and synthesis via Google Gemini Pro.',
    category: 'ai',
    type: 'boolean',
    defaultLimit: null,
    metadata: JSON.stringify({ models: ['gemini-1.5-pro'] }),
  },
  {
    key: 'claude_ai',
    name: 'Claude 3 AI Engine',
    description: 'Elite security audit, vulnerability analysis, and AST code transformation via Claude 3.5 Sonnet & Opus.',
    category: 'ai',
    type: 'boolean',
    defaultLimit: null,
    metadata: JSON.stringify({ models: ['claude-3-5-sonnet-20241022', 'claude-3-opus'] }),
  },
  {
    key: 'llama_ai',
    name: 'Llama 3 AI Engine',
    description: 'Deep security reasoning and privacy-first local-compatible inference via Meta Llama 3.3 70B.',
    category: 'ai',
    type: 'boolean',
    defaultLimit: null,
    metadata: JSON.stringify({ models: ['llama-3.3-70b-versatile'] }),
  },
  // Analytics
  {
    key: 'public_analytics',
    name: 'Public Analytics & Leaderboards',
    description: 'View platform-wide security trends, benchmarks, and public security leaderboards.',
    category: 'analytics',
    type: 'boolean',
    defaultLimit: null,
  },
  {
    key: 'personal_analytics',
    name: 'Personal Real-Time Analytics',
    description: 'Personalized vulnerability metrics, bot execution traces, and historical security trends.',
    category: 'analytics',
    type: 'boolean',
    defaultLimit: null,
  },
  // Security
  {
    key: 'private_security_hub',
    name: 'Private Security Hub',
    description: 'Dedicated isolated environment for repository vulnerability scanning and AST inspections.',
    category: 'security',
    type: 'quota',
    defaultLimit: 10,
  },
  {
    key: 'advanced_threat_intel',
    name: 'Advanced Threat Intelligence',
    description: 'Real-time zero-day vulnerability feeds, CVE correlation, and darknet threat alerts.',
    category: 'security',
    type: 'boolean',
    defaultLimit: null,
  },
  // API
  {
    key: 'api_access',
    name: 'REST & WebSocket API Access',
    description: 'Programmatic API keys for continuous integration, webhook triggers, and automated bot queries.',
    category: 'api',
    type: 'quota',
    defaultLimit: 1000,
    enterprisePrice: 5.00,
  },
  {
    key: 'websocket_api_access',
    name: 'WebSocket API Access',
    description: 'High-throughput bi-directional event streaming and real-time vulnerability event sockets.',
    category: 'api',
    type: 'boolean',
    defaultLimit: null,
    enterprisePrice: 5.00,
  },
  {
    key: 'unlimited_api',
    name: 'Unlimited API Calls',
    description: 'Uncapped high-rate-limit REST & WebSocket API access for production pipelines.',
    category: 'api',
    type: 'boolean',
    defaultLimit: null,
    enterprisePrice: 5.00,
  },
  // Enterprise
  {
    key: 'sla_guarantees',
    name: 'SLA Guarantees (99.9% Uptime)',
    description: 'Contractual uptime guarantees with financially-backed service credits and priority routing.',
    category: 'enterprise',
    type: 'boolean',
    defaultLimit: null,
    enterprisePrice: 5.00,
  },
  {
    key: 'dedicated_ai_instance',
    name: 'Dedicated Private AI Instance',
    description: 'Private single-tenant model weights and isolated inference hardware with zero data retention.',
    category: 'enterprise',
    type: 'boolean',
    defaultLimit: null,
    enterprisePrice: 5.00,
  },
  {
    key: 'white_label',
    name: 'White-label Options',
    description: 'Custom branding, custom corporate subdomains, and co-branded developer reports.',
    category: 'enterprise',
    type: 'boolean',
    defaultLimit: null,
    enterprisePrice: 5.00,
  },
  {
    key: 'phone_support_24_7',
    name: '24/7 Phone & Slack Support',
    description: 'Direct phone line and dedicated private Slack/Teams channel with security engineers.',
    category: 'enterprise',
    type: 'boolean',
    defaultLimit: null,
    enterprisePrice: 5.00,
  },
];

@Injectable()
export class FeaturesService {
  private readonly logger = new Logger(FeaturesService.name);

  constructor(
    @InjectRepository(Feature)
    private readonly featureRepo: Repository<Feature>,
  ) {}

  async findAll(): Promise<Feature[]> {
    return this.featureRepo.find({
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  async findByKey(key: string): Promise<Feature | null> {
    return this.featureRepo.findOne({ where: { key } });
  }

  async findById(id: string): Promise<Feature> {
    const feature = await this.featureRepo.findOne({ where: { id } });
    if (!feature) {
      throw new NotFoundException(`Feature with ID "${id}" not found`);
    }
    return feature;
  }

  async create(dto: CreateFeatureDto): Promise<Feature> {
    const existing = await this.featureRepo.findOne({ where: { key: dto.key } });
    if (existing) {
      throw new ConflictException(`Feature with key "${dto.key}" already exists`);
    }

    const feature: Feature = this.featureRepo.create({
      key: dto.key.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_'),
      name: dto.name,
      description: dto.description || '',
      category: dto.category || 'community',
      type: dto.type || 'boolean',
      defaultLimit: dto.defaultLimit !== undefined ? dto.defaultLimit : null,
      enterprisePrice: dto.enterprisePrice !== undefined ? Number(dto.enterprisePrice) : 5.00,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
      metadata: typeof dto.metadata === 'object' ? JSON.stringify(dto.metadata) : dto.metadata || null,
    });

    return this.featureRepo.save(feature);
  }

  async update(id: string, dto: UpdateFeatureDto): Promise<Feature> {
    const feature = await this.findById(id);

    if (dto.name !== undefined) feature.name = dto.name;
    if (dto.description !== undefined) feature.description = dto.description;
    if (dto.category !== undefined) feature.category = dto.category;
    if (dto.type !== undefined) feature.type = dto.type;
    if (dto.defaultLimit !== undefined) feature.defaultLimit = dto.defaultLimit;
    if (dto.enterprisePrice !== undefined) feature.enterprisePrice = Number(dto.enterprisePrice);
    if (dto.isActive !== undefined) feature.isActive = dto.isActive;
    if (dto.metadata !== undefined) {
      feature.metadata = typeof dto.metadata === 'object' ? JSON.stringify(dto.metadata) : dto.metadata || null;
    }

    return this.featureRepo.save(feature);
  }

  async seedInitialFeatures(): Promise<void> {
    for (const item of INITIAL_FEATURES) {
      const exists = await this.featureRepo.findOne({ where: { key: item.key } });
      if (!exists) {
        this.logger.log(`Seeding feature: ${item.key}`);
        const feature: Feature = this.featureRepo.create({
          key: item.key,
          name: item.name,
          description: item.description,
          category: item.category,
          type: item.type,
          defaultLimit: item.defaultLimit,
          enterprisePrice: (item as any).enterprisePrice ?? 5.00,
          isActive: true,
          metadata: (item as any).metadata || null,
        });
        await this.featureRepo.save(feature);
      } else if (item.category === 'enterprise' && (!exists.enterprisePrice || Number(exists.enterprisePrice) === 0)) {
        exists.enterprisePrice = 5.00;
        await this.featureRepo.save(exists);
      }
    }
  }
}
