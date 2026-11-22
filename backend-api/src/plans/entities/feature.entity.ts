import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { PlanFeature } from './plan-feature.entity';

@Entity()
export class Feature {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  key: string; // e.g. 'private_security_hub'

  @Column()
  name: string; // e.g. 'Private Security Hub'

  @Column('text', { default: '' })
  description: string;

  @Column({ default: 'community' })
  category: string; // 'community' | 'ai' | 'analytics' | 'security' | 'api' | 'enterprise'

  @Column({ default: 'boolean' })
  type: string; // 'boolean' | 'quota' | 'tier'

  @Column('int', { nullable: true })
  defaultLimit: number | null; // null = unlimited or not applicable

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  metadata: string | null; // JSON string for model list, extra config

  @OneToMany(() => PlanFeature, (pf) => pf.feature)
  planFeatures: PlanFeature[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
