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


  async findAll(): Promise<any[]> {
    try {
      const merged = await this.usersRepository.query(`
        SELECT 
          p.id, 
          COALESCE(p.username, split_part(p.email, '@', 1)) as username, 
          p.email, 
          COALESCE(u.rank, INITCAP(p.plan), 'Free') as rank, 
          COALESCE(p.airesponsestoday, u.points, 0) as points,
          COALESCE(p.created_at, NOW()) as "createdAt"
        FROM profiles p
        LEFT JOIN "user" u ON u.id = p.id
        UNION
        SELECT
          u.id,
          u.username,
          u.email,
          u.rank,
          u.points,
          NOW() as "createdAt"
        FROM "user" u
        WHERE u.id NOT IN (SELECT id FROM profiles)
        ORDER BY "createdAt" DESC
      `);
      return merged;
    } catch {
      return this.usersRepository.find();
    }
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

    try {
      await this.usersRepository.query(
        `UPDATE profiles SET plan = $1 WHERE id = $2`,
        [planName.toLowerCase(), userId],
      );
    } catch {
      // Non-fatal if profiles table does not contain the row yet
    }

    try {
      const planRows = await this.usersRepository.query(
        `SELECT id, name FROM plan WHERE LOWER(name) = LOWER($1) OR LOWER(slug) = LOWER($1) LIMIT 1`,
        [planName]
      );
      const planId = planRows && planRows[0] ? planRows[0].id : null;
      const canonicalName = planRows && planRows[0] ? planRows[0].name : planName;

      await this.usersRepository.query(
        `INSERT INTO user_subscription ("id", "userId", "planId", "planName", "status", "billingInterval", "currentPeriodStart", "currentPeriodEnd", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, 'active', 'month', NOW(), NOW() + interval '30 days', NOW(), NOW())
         ON CONFLICT DO NOTHING`,
        [userId, planId, canonicalName]
      );

      await this.usersRepository.query(
        `UPDATE user_subscription
         SET "planId" = $1, "planName" = $2, "status" = 'active', "updatedAt" = NOW()
         WHERE "userId" = $3`,
        [planId, canonicalName, userId]
      );
    } catch (subErr) {
      console.warn('Failed to sync user_subscription in updatePlan:', subErr);
    }

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
