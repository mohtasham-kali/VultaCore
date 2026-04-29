import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findOne(id: string): Promise<User | null> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      // Return a skeleton user for development stability
      return { id, rank: 'Free', username: 'Guest' } as User;
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

  async updatePlan(userId: string, planName: string): Promise<User> {
    let user = await this.usersRepository.findOneBy({ id: userId });
    
    if (!user) {
      // Auto-create user if missing (for demo/dev stability)
      console.log(`User ${userId} not found. Creating new record...`);
      user = this.usersRepository.create({
        id: userId,
        username: `user_${userId.slice(0, 4)}`,
        email: `${userId}@vultacore.app`,
        password: 'demo_password_placeholder', // Required by database schema
        rank: planName
      });
    } else {
      user.rank = planName;
    }
    
    return this.usersRepository.save(user);
  }
}
