"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqliteTransactionRepository = void 0;
const finance_1 = require("../../../domains/finance");
const types_1 = require("../../../shared/types");
/**
 * SQLite implementation of Transaction repository.
 */
class SqliteTransactionRepository {
    knex;
    constructor(knex) {
        this.knex = knex;
    }
    async findById(id) {
        const row = await this.knex('transactions').where({ id }).first();
        return row ? this.toDomain(row) : null;
    }
    async findAll() {
        const rows = await this.knex('transactions').orderBy('created_at', 'desc');
        return rows.map((r) => this.toDomain(r));
    }
    async save(entity) {
        const existing = await this.knex('transactions').where({ id: entity.id }).first();
        const row = this.toPersistence(entity);
        if (existing) {
            await this.knex('transactions').where({ id: entity.id }).update(row);
        }
        else {
            await this.knex('transactions').insert(row);
        }
    }
    async delete(id) {
        // RULE: Transactions are NEVER deleted, only cancelled
        throw new Error('Transactions cannot be deleted. Use cancel() instead.');
    }
    async findByStatus(status) {
        const rows = await this.knex('transactions').where({ status });
        return rows.map((r) => this.toDomain(r));
    }
    async findByType(type) {
        const rows = await this.knex('transactions').where({ type });
        return rows.map((r) => this.toDomain(r));
    }
    async findByProject(projectId) {
        const rows = await this.knex('transactions').where({ related_project_id: projectId });
        return rows.map((r) => this.toDomain(r));
    }
    async findByDateRange(from, to) {
        const rows = await this.knex('transactions')
            .whereBetween('created_at', [from.toISOString(), to.toISOString()])
            .orderBy('created_at', 'desc');
        return rows.map((r) => this.toDomain(r));
    }
    async findByPaymentMethod(method) {
        const rows = await this.knex('transactions').where({ payment_method: method });
        return rows.map((r) => this.toDomain(r));
    }
    async findActive() {
        return this.findByStatus(finance_1.TransactionStatus.ACTIVE);
    }
    // --- Mapping helpers ---
    toDomain(row) {
        return finance_1.Transaction.reconstitute({
            id: row.id,
            amount: types_1.Money.create(row.amount, row.amount_currency),
            vatAmount: types_1.Money.create(row.vat_amount, row.vat_currency),
            type: row.type,
            paymentMethod: row.payment_method,
            isInvoiced: Boolean(row.is_invoiced),
            description: row.description,
            createdBy: row.created_by,
            relatedProjectId: row.related_project_id,
            status: row.status,
            cancellationReason: row.cancellation_reason,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        });
    }
    toPersistence(entity) {
        return {
            id: entity.id,
            amount: entity.amount.amountDecimal,
            amount_currency: entity.amount.currency,
            vat_amount: entity.vatAmount.amountDecimal,
            vat_currency: entity.vatAmount.currency,
            type: entity.type,
            payment_method: entity.paymentMethod,
            is_invoiced: entity.isInvoiced ? 1 : 0,
            description: entity.description,
            created_by: entity.createdBy,
            related_project_id: entity.relatedProjectId ?? null,
            status: entity.status,
            cancellation_reason: entity.cancellationReason ?? null,
            created_at: entity.createdAt.toISOString(),
            updated_at: entity.updatedAt.toISOString(),
        };
    }
}
exports.SqliteTransactionRepository = SqliteTransactionRepository;
//# sourceMappingURL=sqlite-transaction.repository.js.map