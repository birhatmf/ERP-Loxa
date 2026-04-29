"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqliteCustomerRepository = void 0;
const customer_1 = require("../../../domains/customer");
const types_1 = require("../../../shared/types");
class SqliteCustomerRepository {
    knex;
    constructor(knex) {
        this.knex = knex;
    }
    async findById(id) {
        const row = await this.knex('customers').where({ id }).first();
        return row ? this.toDomain(row) : null;
    }
    async findAll() {
        const rows = await this.knex('customers').orderBy('created_at', 'desc');
        return rows.map((row) => this.toDomain(row));
    }
    async save(entity) {
        const existing = await this.knex('customers').where({ id: entity.id }).first();
        const row = this.toPersistence(entity);
        if (existing) {
            await this.knex('customers').where({ id: entity.id }).update(row);
        }
        else {
            await this.knex('customers').insert(row);
        }
    }
    async delete(id) {
        await this.knex('customers').where({ id }).delete();
    }
    toDomain(row) {
        return customer_1.Customer.reconstitute({
            id: row.id,
            name: row.name,
            phone: row.phone ?? '',
            email: row.email ?? '',
            address: row.address ?? '',
            taxId: row.tax_id ?? '',
            notes: row.notes ?? '',
            totalPurchases: types_1.Money.create(row.total_purchases ?? 0),
            outstandingBalance: types_1.Money.create(row.outstanding_balance ?? 0),
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        });
    }
    toPersistence(entity) {
        return {
            id: entity.id,
            name: entity.name,
            phone: entity.phone,
            email: entity.email,
            address: entity.address,
            tax_id: entity.taxId,
            notes: entity.notes,
            total_purchases: entity.totalPurchases.amount,
            outstanding_balance: entity.outstandingBalance.amount,
            created_at: entity.createdAt.toISOString(),
            updated_at: entity.updatedAt.toISOString(),
        };
    }
}
exports.SqliteCustomerRepository = SqliteCustomerRepository;
//# sourceMappingURL=sqlite-customer.repository.js.map