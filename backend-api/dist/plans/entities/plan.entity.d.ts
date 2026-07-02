import { User } from '../../users/entities/user.entity';
export declare class Plan {
    id: string;
    name: string;
    variantId: string;
    price: number;
    interval: string;
    features: string[];
    users: User[];
}
