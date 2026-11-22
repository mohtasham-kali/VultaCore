import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { PlanFeature } from './plan-feature.entity';
import { UserSubscription } from './user-subscription.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true, default: '' })
  slug: string;

  @Column('text', { default: '' })
  description: string;

  @Column({ default: 'developer' })
  category: string; // 'developer' | 'security' | 'enterprise' | 'general'

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  price: number; // legacy monthly price field for backward compatibility

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  monthlyPrice: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  yearlyPrice: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column({ default: 'month' })
  interval: string; // 'month' | 'year' | 'both'

  @Column({ default: false })
  isCustomPricing: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: true })
  isPublic: boolean;

  @Column({ default: true })
  isPublished: boolean;

  @Column({ default: false })
  isRecommended: boolean;

  @Column({ type: 'varchar', nullable: true })
  badge: string | null;

  @Column({ default: 0 })
  displayOrder: number;

  @Column({ default: 1 })
  version: number;

  @Column({ default: 'immediate' })
  planChangePolicy: string; // 'immediate' | 'renewal' | 'new_subscribers'

  @Column({ type: 'varchar', nullable: true })
  paddlePriceIdMonth: string | null;

  @Column({ type: 'varchar', nullable: true })
  paddlePriceIdYear: string | null;

  @Column('simple-array', { nullable: true })
  features: string[] | null; // legacy feature names list

  @OneToMany(() => PlanFeature, (pf) => pf.plan, { cascade: true })
  planFeatures: PlanFeature[];

  @OneToMany(() => UserSubscription, (us) => us.plan)
  subscriptions: UserSubscription[];

  @OneToMany(() => User, (user) => user.plan)
  users: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
