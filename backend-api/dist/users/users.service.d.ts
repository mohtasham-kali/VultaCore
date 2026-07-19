import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
export declare class UsersService {
    private usersRepository;
    constructor(usersRepository: Repository<User>);
    findOne(id: string): Promise<User | null>;
    findOrCreateUser(id: string, email?: string): Promise<User>;
    findAll(): Promise<User[]>;
    findByUsername(username: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    update(id: string, updates: Partial<User>): Promise<User | null>;
    create(userData: Partial<User>): Promise<User>;
    updatePlan(userId: string, planName: string): Promise<User>;
}
