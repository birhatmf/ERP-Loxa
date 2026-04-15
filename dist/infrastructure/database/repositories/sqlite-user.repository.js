"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqliteUserRepository = void 0;
const user_entity_1 = require("@domains/auth/entities/user.entity");
class SqliteUserRepository {
    knex;
    constructor(knex) {
        this.knex = knex;
    }
    async findById(id) {
        const row = await this.knex('users').where({ id }).first();
        return row ? this.toDomain(row) : null;
    }
    async findByUsername(username) {
        const row = await this.knex('users').where({ username: username.toLowerCase() }).first();
        return row ? this.toDomain(row) : null;
    }
    async findAll() {
        const rows = await this.knex('users').orderBy('created_at', 'desc');
        return rows.map((r) => this.toDomain(r));
    }
    async save(entity) {
        const existing = await this.knex('users').where({ id: entity.id }).first();
        const row = this.toPersistence(entity);
        if (existing) {
            await this.knex('users').where({ id: entity.id }).update(row);
        }
        else {
            await this.knex('users').insert(row);
        }
    }
    async delete(id) {
        await this.knex('users').where({ id }).delete();
    }
    toDomain(row) {
        return user_entity_1.User.reconstitute({
            id: row.id,
            username: row.username,
            passwordHash: row.password_hash,
            name: row.name,
            role: row.role,
            isActive: Boolean(row.is_active),
            lastLogin: row.last_login ? new Date(row.last_login) : undefined,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        });
    }
    toPersistence(entity) {
        return {
            id: entity.id,
            username: entity.username,
            password_hash: entity._passwordHash,
            name: entity.name,
            role: entity.role,
            is_active: entity.isActive ? 1 : 0,
            last_login: entity.lastLogin?.toISOString() ?? null,
            created_at: entity.createdAt.toISOString(),
            updated_at: entity.updatedAt.toISOString(),
        };
    }
}
exports.SqliteUserRepository = SqliteUserRepository;
//# sourceMappingURL=sqlite-user.repository.js.map