import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne } from 'typeorm';
import { Post } from '../../forum/entities/post.entity';
import { Comment } from '../../forum/entities/comment.entity';
import { Plan } from '../../plans/entities/plan.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ default: 0 })
  points: number;

  @Column({ default: 'Level 1' })
  rank: string;
  
  @Column({ default: false })
  isBot: boolean;

  @ManyToOne(() => Plan, (plan) => plan.users)
  plan: Plan;

  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];

  @OneToMany(() => Comment, (comment) => comment.author)
  comments: Comment[];

  @OneToMany('Notification', 'user')
  notifications: any[];
}
