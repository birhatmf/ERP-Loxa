"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqliteSupplierRepository = void 0;
class SqliteSupplierRepository {
    knex;
    constructor(knex) {
        this.knex = knex;
    }
    async findById(id) {
        const row = await this.knex('suppliers').where({ id }).first();
        return row ? this.toDomain(row) : null;
    }
    async findAll() {
        const rows = await this.knex('suppliers').orderBy('created_at', 'desc');
        const suppliers = [];
        for (const row of rows) {
            const totalOrdersRow = await this.knex('purchase_orders')
                .where({ supplier_id: row.id })
                .count({ total: 'id' })
                .first();
            suppliers.push({
                ...this.toDomain(row),
                totalOrders: Number(totalOrdersRow?.total ?? 0),
            });
        }
        return suppliers;
    }
    async save(entity) {
        const existing = await this.knex('suppliers').where({ id: entity.id }).first();
        const row = this.toPersistence(entity);
        if (existing) {
            await this.knex('suppliers').where({ id: entity.id }).update(row);
        }
        else {
            await this.knex('suppliers').insert(row);
        }
    }
    async delete(id) {
        await this.knex('suppliers').where({ id }).delete();
    }
    toDomain(row) {
        return {
            id: row.id,
            name: row.name,
            contactPerson: row.contact_person ?? '',
            phone: row.phone ?? '',
            email: row.email ?? '',
            address: row.address ?? '',
            taxId: row.tax_id ?? '',
            notes: row.notes ?? '',
            totalOrders: row.totalOrders !== undefined ? Number(row.totalOrders) : undefined,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        };
    }
    toPersistence(entity) {
        return {
            id: entity.id,
            name: entity.name,
            contact_person: entity.contactPerson,
            phone: entity.phone,
            email: entity.email,
            address: entity.address,
            tax_id: entity.taxId,
            notes: entity.notes,
            created_at: entity.createdAt.toISOString(),
            updated_at: entity.updatedAt.toISOString(),
        };
    }
}
exports.SqliteSupplierRepository = SqliteSupplierRepository;
//# sourceMappingURL=sqlite-supplier.repository.js.map