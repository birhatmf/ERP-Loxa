import { Knex } from 'knex';
import { generateId } from '@shared/types';
import { NotificationRecord } from '@shared/notifications/notification.types';
import { INotificationRepository } from '@shared/notifications/notification.repository';

export class SqliteNotificationRepository implements INotificationRepository {
  constructor(private knex: Knex) {}

  async save(notification: NotificationRecord): Promise<void> {
    const existing = notification.id
      ? await this.knex('notifications').where({ id: notification.id }).first()
      : null;
    const row = this.toPersistence(notification);

    if (existing) {
      await this.knex('notifications').where({ id: row.id }).update(row);
    } else {
      await this.knex('notifications').insert(row);
    }
  }

  async findAll(): Promise<NotificationRecord[]> {
    const rows = await this.knex('notifications').orderBy('created_at', 'desc');
    return rows.map((row: any) => this.toDomain(row));
  }

  async markAsRead(id: string): Promise<void> {
    await this.knex('notifications').where({ id }).update({
      read: 1,
      updated_at: new Date().toISOString(),
    });
  }

  async markAllAsRead(): Promise<void> {
    await this.knex('notifications').where({ read: 0 }).update({
      read: 1,
      updated_at: new Date().toISOString(),
    });
  }

  private toDomain(row: any): NotificationRecord {
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      entityId: row.entity_id,
      entityType: row.entity_type,
      read: Boolean(row.read),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private toPersistence(notification: NotificationRecord): Record<string, any> {
    const now = new Date().toISOString();
    return {
      id: notification.id ?? generateId(),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      entity_id: notification.entityId ?? null,
      entity_type: notification.entityType ?? null,
      read: notification.read ? 1 : 0,
      created_at: notification.createdAt?.toISOString() ?? now,
      updated_at: notification.updatedAt?.toISOString() ?? now,
    };
  }
}

