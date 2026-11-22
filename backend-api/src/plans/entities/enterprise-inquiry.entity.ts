import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity()
export class EnterpriseInquiry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ unique: true })
  reference: string; // e.g. 'ENT-2026-9812'

  @Index()
  @Column({ type: 'varchar', nullable: true })
  userId: string | null;

  @Column()
  fullName: string;

  @Column()
  companyName: string;

  @Column()
  email: string;

  @Column({ default: '' })
  phone: string;

  @Column('text')
  requestedFeatures: string; // JSON array of feature keys

  @Column({ default: '1-10' })
  numberOfUsers: string;

  @Column({ type: 'text', nullable: true })
  expectedUsage: string | null;

  @Column({ type: 'text', nullable: true })
  customRequirements: string | null;

  @Column({ type: 'text', nullable: true })
  additionalMessage: string | null;

  @Column({ default: 'new' })
  status: string; // 'new' | 'under_review' | 'approved' | 'converted' | 'rejected'

  @Column({ type: 'text', nullable: true })
  adminNotes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
