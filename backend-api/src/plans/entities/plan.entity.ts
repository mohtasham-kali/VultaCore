import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  // Lemon Squeezy variant id created automatically by Lemon Squeezy when admin adds the plan
  // (stored so checkout + webhook can be mapped dynamically)
  @Column()
  variantId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column()
  interval: string; // 'monthly' | 'yearly'

  @Column('simple-array')
  features: string[];

  @OneToMany(() => User, (user) => user.plan)
  users: User[];
}
