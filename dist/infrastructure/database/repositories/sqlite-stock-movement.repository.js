"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqliteStockMovementRepository = void 0;
const inventory_1 = require("../../../domains/inventory");
class SqliteStockMovementRepository {
    knex;
    constructor(knex) {
        this.knex = knex;
    }
    async findById(id) {
        const row = await this.knex('stock_movements').where({ id }).first();
        return row ? this.toDomain(row) : null;
    }
    async findAll() {
        const rows = await this.knex('stock_movements').orderBy('date', 'desc');
        return rows.map((row) => this.toDomain(row));
    }
    async save(entity) {
        const existing = await this.knex('stock_movements').where({ id: entity.id }).first();
        const row = this.toPersistence(entity);
        if (existing) {
            await this.knex('stock_movements').where({ id: entity.id }).update(row);
        }
        else {
            await this.knex('stock_movements').insert(row);
        }
    }
    async delete(id) {
        await this.knex('stock_movements').where({ id }).delete();
    }
    async findByMaterial(materialId) {
        const rows = await this.knex('stock_movements').where({ material_id: materialId }).orderBy('date', 'desc');
        return rows.map((row) => this.toDomain(row));
    }
    async findByProject(projectId) {
        const rows = await this.knex('stock_movements').where({ related_project_id: projectId }).orderBy('date', 'desc');
        return rows.map((row) => this.toDomain(row));
    }
    async findByType(type) {
        const rows = await this.knex('stock_movements').where({ type }).orderBy('date', 'desc');
        return rows.map((row) => this.toDomain(row));
    }
    async findByDateRange(from, to) {
        const rows = await this.knex('stock_movements')
            .whereBetween('date', [from.toISOString(), to.toISOString()])
            .orderBy('date', 'desc');
        return rows.map((row) => this.toDomain(row));
    }
    toDomain(row) {
        return inventory_1.StockMovement.reconstitute({
            id: row.id,
            materialId: row.material_id,
            type: row.type,
            quantity: parseFloat(row.quantity),
            description: row.description,
            relatedProjectId: row.related_project_id,
            date: new Date(row.date),
            isCorrection: Boolean(row.is_correction),
            correctionReason: row.correction_reason ?? null,
            correctedAt: row.corrected_at ? new Date(row.corrected_at) : null,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        });
    }
    toPersistence(entity) {
        return {
            id: entity.id,
            material_id: entity.materialId,
            type: entity.type,
            quantity: entity.quantity,
            description: entity.description,
            related_project_id: entity.relatedProjectId ?? null,
            date: entity.date.toISOString(),
            is_correction: entity.isCorrection ? 1 : 0,
            correction_reason: entity.correctionReason ?? null,
            corrected_at: entity.correctedAt?.toISOString() ?? null,
            created_at: entity.createdAt.toISOString(),
            updated_at: entity.updatedAt.toISOString(),
        };
    }
}
exports.SqliteStockMovementRepository = SqliteStockMovementRepository;
//# sourceMappingURL=sqlite-stock-movement.repository.js.map