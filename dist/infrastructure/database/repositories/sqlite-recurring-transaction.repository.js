"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqliteRecurringTransactionRepository = void 0;
const recurring_transaction_entity_1 = require("../../../domains/finance/entities/recurring-transaction.entity");
const types_1 = require("../../../shared/types");
class SqliteRecurringTransactionRepository {
    knex;
    constructor(knex) {
        this.knex = knex;
    }
    async findById(id) {
        const row = await this.knex('recurring_transactions').where({ id }).first();
        return row ? this.toDomain(row) : null;
    }
    async findAll() {
        const rows = await this.knex('recurring_transactions').orderBy('next_run', 'asc');
        return rows.map((row) => this.toDomain(row));
    }
    async save(entity) {
        const existing = await this.knex('recurring_transactions').where({ id: entity.id }).first();
        const row = this.toPersistence(entity);
        if (existing) {
            await this.knex('recurring_transactions').where({ id: entity.id }).update(row);
        }
        else {
            await this.knex('recurring_transactions').insert(row);
        }
    }
    async delete(id) {
        await this.knex('recurring_transactions').where({ id }).delete();
    }
    async findActive() {
        const rows = await this.knex('recurring_transactions').where({ is_active: 1 }).orderBy('next_run', 'asc');
        return rows.map((row) => this.toDomain(row));
    }
    async findDue(now = new Date()) {
        const rows = await this.knex('recurring_transactions')
            .where({ is_active: 1 })
            .andWhere('next_run', '<=', now.toISOString())
            .orderBy('next_run', 'asc');
        return rows.map((row) => this.toDomain(row));
    }
    toDomain(row) {
        return recurring_transaction_entity_1.RecurringTransaction.reconstitute({
            id: row.id,
            description: row.description,
            amount: types_1.Money.create(row.amount, row.amount_currency),
            type: row.type,
            category: row.category,
            paymentMethod: row.payment_method,
            frequency: row.frequency,
            dayOfMonth: Number(row.day_of_month),
            isActive: Boolean(row.is_active),
            nextRun: new Date(row.next_run),
            lastRun: row.last_run ? new Date(row.last_run) : undefined,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        });
    }
    toPersistence(entity) {
        return {
            id: entity.id,
            description: entity.description,
            amount: entity.amount.amountDecimal,
            amount_currency: entity.amount.currency,
            type: entity.type,
            category: entity.category,
            payment_method: entity.paymentMethod,
            frequency: entity.frequency,
            day_of_month: entity.dayOfMonth,
            is_active: entity.isActive ? 1 : 0,
            next_run: entity.nextRun.toISOString(),
            last_run: entity.lastRun?.toISOString() ?? null,
            created_at: entity.createdAt.toISOString(),
            updated_at: entity.updatedAt.toISOString(),
        };
    }
}
exports.SqliteRecurringTransactionRepository = SqliteRecurringTransactionRepository;
//# sourceMappingURL=sqlite-recurring-transaction.repository.js.map