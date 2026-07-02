import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  type: string; // 'alert', 'info', 'success', 'warning'

  @Column({ nullable: true })
  link: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.id)
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
