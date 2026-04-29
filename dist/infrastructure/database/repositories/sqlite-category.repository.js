"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqliteCategoryRepository = void 0;
const category_entity_1 = require("../../../domains/category/entities/category.entity");
class SqliteCategoryRepository {
    knex;
    constructor(knex) {
        this.knex = knex;
    }
    async findById(id) {
        const row = await this.knex('categories').where({ id }).first();
        return row ? this.toDomain(row) : null;
    }
    async findAll() {
        const rows = await this.knex('categories').orderBy('name', 'asc');
        return rows.map((row) => this.toDomain(row));
    }
    async findByType(type) {
        const rows = await this.knex('categories').where({ type }).orderBy('name', 'asc');
        return rows.map((row) => this.toDomain(row));
    }
    async save(entity) {
        const existing = await this.knex('categories').where({ id: entity.id }).first();
        const row = this.toPersistence(entity);
        if (existing) {
            await this.knex('categories').where({ id: entity.id }).update(row);
        }
        else {
            await this.knex('categories').insert(row);
        }
    }
    async delete(id) {
        await this.knex('categories').where({ id }).delete();
    }
    toDomain(row) {
        return category_entity_1.Category.reconstitute({
            id: row.id,
            name: row.name,
            type: row.type,
            color: row.color ?? '#6366f1',
            icon: row.icon ?? '',
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        });
    }
    toPersistence(entity) {
        return {
            id: entity.id,
            name: entity.name,
            type: entity.type,
            color: entity.color,
            icon: entity.icon,
            created_at: entity.createdAt.toISOString(),
            updated_at: entity.updatedAt.toISOString(),
        };
    }
}
exports.SqliteCategoryRepository = SqliteCategoryRepository;
//# sourceMappingURL=sqlite-category.repository.js.map