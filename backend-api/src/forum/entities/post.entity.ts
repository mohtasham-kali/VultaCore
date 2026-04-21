import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Comment } from './comment.entity';

@Entity()
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column()
  type: 'dev' | 'cyber';

  @Column({ nullable: true })
  severity?: 'low' | 'medium' | 'high' | 'critical';

  @ManyToOne(() => User, (user) => user.posts)
  author: User;

  @Column('simple-array', { nullable: true })
  tags: string[];

  @Column({ default: 0 })
  likes: number;

  @Column({ default: 0 })
  commentsCount: number;

  @Column({ default: false })
  isResolved: boolean;

  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];

  @CreateDateColumn()
  createdAt: Date;
}
