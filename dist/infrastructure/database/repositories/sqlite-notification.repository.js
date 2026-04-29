"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqliteNotificationRepository = void 0;
const types_1 = require("../../../shared/types");
class SqliteNotificationRepository {
    knex;
    constructor(knex) {
        this.knex = knex;
    }
    async save(notification) {
        const existing = notification.id
            ? await this.knex('notifications').where({ id: notification.id }).first()
            : null;
        const row = this.toPersistence(notification);
        if (existing) {
            await this.knex('notifications').where({ id: row.id }).update(row);
        }
        else {
            await this.knex('notifications').insert(row);
        }
    }
    async findAll() {
        const rows = await this.knex('notifications').orderBy('created_at', 'desc');
        return rows.map((row) => this.toDomain(row));
    }
    async markAsRead(id) {
        await this.knex('notifications').where({ id }).update({
            read: 1,
            updated_at: new Date().toISOString(),
        });
    }
    async markAllAsRead() {
        await this.knex('notifications').where({ read: 0 }).update({
            read: 1,
            updated_at: new Date().toISOString(),
        });
    }
    toDomain(row) {
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
    toPersistence(notification) {
        const now = new Date().toISOString();
        return {
            id: notification.id ?? (0, types_1.generateId)(),
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
exports.SqliteNotificationRepository = SqliteNotificationRepository;
//# sourceMappingURL=sqlite-notification.repository.js.map