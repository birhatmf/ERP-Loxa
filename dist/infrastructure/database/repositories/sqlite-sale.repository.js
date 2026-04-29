"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqliteSaleRepository = void 0;
const sale_entity_1 = require("../../../domains/sale/entities/sale.entity");
const types_1 = require("../../../shared/types");
class SqliteSaleRepository {
    knex;
    constructor(knex) {
        this.knex = knex;
    }
    async findById(id) {
        const row = await this.knex('sales').where({ id }).first();
        if (!row)
            return null;
        const itemRows = await this.knex('sale_items').where({ sale_id: id });
        const items = itemRows.map(r => this.toSaleItem(r));
        return this.toDomain(row, items);
    }
    async findAll() {
        const rows = await this.knex('sales').orderBy('created_at', 'desc');
        const sales = [];
        for (const row of rows) {
            const itemRows = await this.knex('sale_items').where({ sale_id: row.id });
            sales.push(this.toDomain(row, itemRows.map(r => this.toSaleItem(r))));
        }
        return sales;
    }
    async save(entity) {
        const existing = await this.knex('sales').where({ id: entity.id }).first();
        const saleRow = this.toSalePersistence(entity);
        if (existing) {
            await this.knex('sales').where({ id: entity.id }).update(saleRow);
        }
        else {
            await this.knex('sales').insert(saleRow);
        }
        // Save items - delete existing and re-insert
        await this.knex('sale_items').where({ sale_id: entity.id }).delete();
        for (const item of entity.items) {
            await this.knex('sale_items').insert({
                id: item.id,
                sale_id: entity.id,
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unitPrice.amountDecimal,
                total_price: item.totalPrice.amountDecimal,
                created_at: entity.createdAt.toISOString(),
                updated_at: entity.updatedAt.toISOString(),
            });
        }
    }
    async delete(id) {
        await this.knex('sale_items').where({ sale_id: id }).delete();
        await this.knex('sales').where({ id }).delete();
    }
    toDomain(row, items) {
        return sale_entity_1.Sale.reconstitute({
            id: row.id,
            customerName: row.customer_name,
            customerPhone: row.customer_phone ?? '',
            customerAddress: row.customer_address ?? '',
            items,
            totalAmount: types_1.Money.create(parseFloat(row.total_amount)),
            paymentStatus: row.payment_status,
            paymentMethod: row.payment_method,
            paymentNote: row.payment_note ?? '',
            description: row.description ?? '',
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        });
    }
    toSaleItem(row) {
        return sale_entity_1.SaleItem.reconstitute({
            id: row.id,
            description: row.description,
            quantity: parseFloat(row.quantity),
            unitPrice: types_1.Money.create(parseFloat(row.unit_price)),
            totalPrice: types_1.Money.create(parseFloat(row.total_price)),
        });
    }
    toSalePersistence(entity) {
        return {
            id: entity.id,
            customer_name: entity.customerName,
            customer_phone: entity.customerPhone,
            customer_address: entity.customerAddress,
            total_amount: entity.totalAmount.amountDecimal,
            payment_status: entity.paymentStatus,
            payment_method: entity.paymentMethod,
            payment_note: entity.paymentNote,
            description: entity.description,
            created_at: entity.createdAt.toISOString(),
            updated_at: entity.updatedAt.toISOString(),
        };
    }
}
exports.SqliteSaleRepository = SqliteSaleRepository;
//# sourceMappingURL=sqlite-sale.repository.js.map