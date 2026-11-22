import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn, Index, Unique } from 'typeorm';

@Entity()
@Unique(['userId', 'featureKey', 'period'])
export class FeatureUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  @Index()
  @Column()
  featureKey: string; // e.g. 'basic_ai_chat', 'api_access'

  @Index()
  @Column()
  period: string; // e.g. '2026-11-22' for daily, '2026-11' for monthly, or 'total'

  @Column({ default: 0 })
  usageCount: number;

  @UpdateDateColumn()
  updatedAt: Date;
}

