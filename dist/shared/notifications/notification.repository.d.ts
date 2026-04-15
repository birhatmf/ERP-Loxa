import { NotificationRecord } from './notification.types';
export interface INotificationRepository {
    save(notification: NotificationRecord): Promise<void>;
    findAll(): Promise<NotificationRecord[]>;
    markAsRead(id: string): Promise<void>;
    markAllAsRead(): Promise<void>;
}
//# sourceMappingURL=notification.repository.d.ts.map