import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  email: string;

  @Column()
  companyName: string;

  @Column()
  companySize: string;

  @Column()
  interest: string;

  @Column()
  phone: string;

  @Column('text')
  challenges: string;

  @CreateDateColumn()
  createdAt: Date;
}
