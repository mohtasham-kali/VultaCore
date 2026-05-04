import { User } from '../../users/entities/user.entity';
export declare class Notification {
    id: string;
    title: string;
    message: string;
    isRead: boolean;
    type: string;
    link: string;
    userId: string;
    user: User;
    createdAt: Date;
}
