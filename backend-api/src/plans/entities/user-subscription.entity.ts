import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Plan } from './plan.entity';

@Entity()
export class UserSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  @Column({ type: 'varchar', nullable: true })
  planId: string | null;

  @ManyToOne(() => Plan, (plan) => plan.subscriptions, { eager: true, nullable: true })
  @JoinColumn({ name: 'planId' })
  plan: Plan | null;

  @Column({ default: 'Free' })
  planName: string; // 'Free' | 'Standard' | 'Premium' | 'Enterprise'

  @Column({ default: 'active' })
  status: string; // 'active' | 'canceled' | 'past_due' | 'suspended' | 'expired'

  @Column({ default: 'month' })
  billingInterval: string; // 'month' | 'year' | 'custom'

  @Column({ type: 'timestamp', nullable: true })
  currentPeriodStart: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  currentPeriodEnd: Date | null;

  @Column({ default: false })
  cancelAtPeriodEnd: boolean;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  customPrice: number | null;

  @Column({ default: false })
  isEnterpriseCustom: boolean;

  @Column({ type: 'text', nullable: true })
  customFeatures: string | null;

  @Column({ type: 'varchar', nullable: true })
  paddleSubscriptionId: string | null;

  @Column({ type: 'varchar', nullable: true })
  paddleCustomerId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
