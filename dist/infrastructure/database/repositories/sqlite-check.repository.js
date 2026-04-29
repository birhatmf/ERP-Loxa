"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqliteCheckRepository = void 0;
const payment_1 = require("../../../domains/payment");
const types_1 = require("../../../shared/types");
/**
 * SQLite implementation of Check repository.
 */
class SqliteCheckRepository {
    knex;
    constructor(knex) {
        this.knex = knex;
    }
    async findById(id) {
        const row = await this.knex('checks').where({ id }).first();
        return row ? this.toDomain(row) : null;
    }
    async findAll() {
        const rows = await this.knex('checks').orderBy('due_date', 'asc');
        return rows.map((r) => this.toDomain(r));
    }
    async save(entity) {
        const existing = await this.knex('checks').where({ id: entity.id }).first();
        const row = this.toPersistence(entity);
        if (existing) {
            await this.knex('checks').where({ id: entity.id }).update(row);
        }
        else {
            await this.knex('checks').insert(row);
        }
    }
    async delete(id) {
        await this.knex('checks').where({ id }).delete();
    }
    async findByStatus(status) {
        const rows = await this.knex('checks').where({ status });
        return rows.map((r) => this.toDomain(r));
    }
    async findByType(type) {
        const rows = await this.knex('checks').where({ type });
        return rows.map((r) => this.toDomain(r));
    }
    async findPending() {
        return this.findByStatus(payment_1.CheckStatus.PENDING);
    }
    async findOverdue() {
        const now = new Date().toISOString();
        const rows = await this.knex('checks')
            .where({ status: payment_1.CheckStatus.PENDING })
            .where('due_date', '<', now)
            .orderBy('due_date', 'asc');
        return rows.map((r) => this.toDomain(r));
    }
    async findByDueDateRange(from, to) {
        const rows = await this.knex('checks')
            .whereBetween('due_date', [from.toISOString(), to.toISOString()])
            .orderBy('due_date', 'asc');
        return rows.map((r) => this.toDomain(r));
    }
    async findByProject(projectId) {
        const rows = await this.knex('checks').where({ related_project_id: projectId });
        return rows.map((r) => this.toDomain(r));
    }
    toDomain(row) {
        return payment_1.Check.reconstitute({
            id: row.id,
            type: row.type,
            amount: types_1.Money.create(row.amount, row.amount_currency),
            dueDate: new Date(row.due_date),
            ownerName: row.owner_name,
            checkNumber: row.check_number,
            bankName: row.bank_name,
            description: row.description,
            status: row.status,
            paidDate: row.paid_date ? new Date(row.paid_date) : undefined,
            relatedProjectId: row.related_project_id,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        });
    }
    toPersistence(entity) {
        return {
            id: entity.id,
            type: entity.type,
            amount: entity.amount.amountDecimal,
            amount_currency: entity.amount.currency,
            due_date: entity.dueDate.toISOString(),
            owner_name: entity.ownerName,
            check_number: entity.checkNumber ?? null,
            bank_name: entity.bankName ?? null,
            description: entity.description,
            status: entity.status,
            paid_date: entity.paidDate?.toISOString() ?? null,
            related_project_id: entity.relatedProjectId ?? null,
            created_at: entity.createdAt.toISOString(),
            updated_at: entity.updatedAt.toISOString(),
        };
    }
}
exports.SqliteCheckRepository = SqliteCheckRepository;
//# sourceMappingURL=sqlite-check.repository.js.map