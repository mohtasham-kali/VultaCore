import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { BillingService } from '../billing/billing.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @Inject(forwardRef(() => BillingService))
    private billingService: BillingService,
  ) {}

  async findOne(id: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  async findOrCreateUser(id: string, email?: string): Promise<User> {
    let user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      user = this.usersRepository.create({
        id,
        username: email ? email.split('@')[0] : `user_${id.slice(0, 4)}`,
        email: email || `${id}@vultacore.app`,
        password: 'sso_user_no_password',
      });
      return this.usersRepository.save(user);
    }
    return user;
  }


  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ username });
  }

  create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }

  async updatePlan(userId: string, planName: string, syncPaddle: boolean = true): Promise<User & { paddleSync?: any }> {
    let user = await this.usersRepository.findOneBy({ id: userId });
    
    if (!user) {
      // Auto-create user if missing (for demo/dev stability)
      console.log(`User ${userId} not found. Creating new record...`);
      user = this.usersRepository.create({
        id: userId,
        username: `user_${userId.slice(0, 4)}`,
        email: `${userId}@vultacore.app`,
        password: 'demo_password_placeholder', // Required by database schema
        rank: planName,
      });
    } else {
      user.rank = planName;
    }
    
    const savedUser = await this.usersRepository.save(user);

    let paddleSyncResult: any = undefined;
    if (syncPaddle && this.billingService) {
      try {
        paddleSyncResult = await this.billingService.syncUserPlanToPaddle(savedUser, planName);
      } catch (err: any) {
        console.error('Paddle sync error in updatePlan:', err?.message || err);
      }
    }

    return Object.assign(savedUser, { paddleSync: paddleSyncResult });
  }
}
