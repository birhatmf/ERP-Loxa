"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqliteMaterialRepository = void 0;
const inventory_1 = require("@domains/inventory");
/**
 * SQLite implementation of Material repository.
 */
class SqliteMaterialRepository {
    knex;
    constructor(knex) {
        this.knex = knex;
    }
    async findById(id) {
        const row = await this.knex('materials').where({ id }).first();
        return row ? this.toDomain(row) : null;
    }
    async findAll() {
        const rows = await this.knex('materials').orderBy('name');
        return rows.map((r) => this.toDomain(r));
    }
    async save(entity) {
        const existing = await this.knex('materials').where({ id: entity.id }).first();
        const row = this.toPersistence(entity);
        if (existing) {
            await this.knex('materials').where({ id: entity.id }).update(row);
        }
        else {
            await this.knex('materials').insert(row);
        }
    }
    async delete(id) {
        await this.knex('materials').where({ id }).delete();
    }
    async findByName(name) {
        const row = await this.knex('materials').where({ name }).first();
        return row ? this.toDomain(row) : null;
    }
    async findLowStock() {
        const rows = await this.knex('materials')
            .whereRaw('current_stock <= min_stock_level')
            .orderBy('name');
        return rows.map((r) => this.toDomain(r));
    }
    toDomain(row) {
        return inventory_1.Material.reconstitute({
            id: row.id,
            name: row.name,
            unit: row.unit,
            currentStock: parseFloat(row.current_stock),
            minStockLevel: parseFloat(row.min_stock_level),
            manualPrice: row.manual_price !== null && row.manual_price !== undefined
                ? parseFloat(row.manual_price)
                : null,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        });
    }
    toPersistence(entity) {
        return {
            id: entity.id,
            name: entity.name,
            unit: entity.unit,
            current_stock: entity.currentStock,
            min_stock_level: entity.minStockLevel,
            manual_price: entity.manualPrice ?? null,
            created_at: entity.createdAt.toISOString(),
            updated_at: entity.updatedAt.toISOString(),
        };
    }
}
exports.SqliteMaterialRepository = SqliteMaterialRepository;
//# sourceMappingURL=sqlite-material.repository.js.map