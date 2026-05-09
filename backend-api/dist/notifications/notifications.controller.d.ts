import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    create(notificationData: Partial<Notification>): Promise<Notification>;
    findByUser(userId: string): Promise<Notification[]>;
    markAsRead(id: string): Promise<void>;
    markAllAsRead(userId: string): Promise<void>;
    remove(id: string): Promise<void>;
}
