import { Knex } from 'knex';
import { NotificationRecord } from '@shared/notifications/notification.types';
import { INotificationRepository } from '@shared/notifications/notification.repository';
export declare class SqliteNotificationRepository implements INotificationRepository {
    private knex;
    constructor(knex: Knex);
    save(notification: NotificationRecord): Promise<void>;
    findAll(): Promise<NotificationRecord[]>;
    markAsRead(id: string): Promise<void>;
    markAllAsRead(): Promise<void>;
    private toDomain;
    private toPersistence;
}
//# sourceMappingURL=sqlite-notification.repository.d.ts.map