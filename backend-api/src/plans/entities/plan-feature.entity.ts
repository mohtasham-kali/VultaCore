import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Plan } from './plan.entity';
import { Feature } from './feature.entity';

@Entity()
export class PlanFeature {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  planId: string;

  @ManyToOne(() => Plan, (plan) => plan.planFeatures, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'planId' })
  plan: Plan;

  @Column()
  featureId: string;

  @ManyToOne(() => Feature, (feature) => feature.planFeatures, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'featureId' })
  feature: Feature;

  @Column({ default: true })
  isEnabled: boolean;

  @Column('int', { nullable: true })
  limitValue: number | null; // null = unlimited

  @Column({ type: 'text', nullable: true })
  config: string | null; // JSON string for model lists, tier configs

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
