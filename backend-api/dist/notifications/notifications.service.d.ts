import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
export declare class NotificationsService {
    private readonly notificationRepository;
    constructor(notificationRepository: Repository<Notification>);
    create(notificationData: Partial<Notification>): Promise<Notification>;
    findByUser(userId: string): Promise<Notification[]>;
    markAsRead(id: string): Promise<void>;
    markAllAsRead(userId: string): Promise<void>;
    delete(id: string): Promise<void>;
}
