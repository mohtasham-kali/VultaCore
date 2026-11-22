import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity()
export class SubscriptionAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  userId: string | null;

  @Column({ default: 'admin' })
  adminEmail: string;

  @Column()
  action: string; // 'PLAN_CREATED', 'PLAN_UPDATED', 'PLAN_DUPLICATED', 'PLAN_ARCHIVED', 'ENTERPRISE_CUSTOMIZED', etc.

  @Column('text')
  details: string; // JSON string with diff/snapshot

  @CreateDateColumn()
  createdAt: Date;
}
