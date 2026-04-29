"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqliteBudgetRepository = void 0;
const budget_item_entity_1 = require("../../../domains/budget/entities/budget-item.entity");
const types_1 = require("../../../shared/types");
class SqliteBudgetRepository {
    knex;
    constructor(knex) {
        this.knex = knex;
    }
    async findById(id) {
        const row = await this.knex('budget_items').where({ id }).first();
        return row ? this.toDomain(row) : null;
    }
    async findAll() {
        const rows = await this.knex('budget_items').orderBy('period', 'desc').orderBy('created_at', 'desc');
        return rows.map((row) => this.toDomain(row));
    }
    async findByPeriod(period) {
        const rows = await this.knex('budget_items').where({ period }).orderBy('created_at', 'desc');
        return rows.map((row) => this.toDomain(row));
    }
    async save(entity) {
        const existing = await this.knex('budget_items').where({ id: entity.id }).first();
        const row = this.toPersistence(entity);
        if (existing) {
            await this.knex('budget_items').where({ id: entity.id }).update(row);
        }
        else {
            await this.knex('budget_items').insert(row);
        }
    }
    async delete(id) {
        await this.knex('budget_items').where({ id }).delete();
    }
    toDomain(row) {
        return budget_item_entity_1.BudgetItem.reconstitute({
            id: row.id,
            category: row.category,
            type: row.type,
            planned: types_1.Money.create(row.planned),
            period: row.period,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        });
    }
    toPersistence(entity) {
        return {
            id: entity.id,
            category: entity.category,
            type: entity.type,
            planned: entity.planned.amountDecimal,
            period: entity.period,
            created_at: entity.createdAt.toISOString(),
            updated_at: entity.updatedAt.toISOString(),
        };
    }
}
exports.SqliteBudgetRepository = SqliteBudgetRepository;
//# sourceMappingURL=sqlite-budget.repository.js.map