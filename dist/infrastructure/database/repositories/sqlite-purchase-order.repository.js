"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlitePurchaseOrderRepository = void 0;
exports.buildPurchaseOrderRecord = buildPurchaseOrderRecord;
const types_1 = require("@shared/types");
class SqlitePurchaseOrderRepository {
    knex;
    constructor(knex) {
        this.knex = knex;
    }
    async findById(id) {
        const row = await this.knex('purchase_orders').where({ id }).first();
        if (!row)
            return null;
        const items = await this.knex('purchase_order_items').where({ purchase_order_id: id }).orderBy('created_at', 'asc');
        return this.toDomain(row, items);
    }
    async findAll() {
        const rows = await this.knex('purchase_orders').orderBy('created_at', 'desc');
        const orders = [];
        for (const row of rows) {
            const items = await this.knex('purchase_order_items').where({ purchase_order_id: row.id }).orderBy('created_at', 'asc');
            orders.push(this.toDomain(row, items));
        }
        return orders;
    }
    async save(entity) {
        const existing = await this.knex('purchase_orders').where({ id: entity.id }).first();
        const row = this.toPersistence(entity);
        if (existing) {
            await this.knex('purchase_orders').where({ id: entity.id }).update(row);
        }
        else {
            await this.knex('purchase_orders').insert(row);
        }
        await this.knex('purchase_order_items').where({ purchase_order_id: entity.id }).delete();
        for (const item of entity.items) {
            await this.knex('purchase_order_items').insert({
                id: item.id,
                purchase_order_id: entity.id,
                material_id: item.materialId,
                material_name: item.materialName,
                quantity: item.quantity,
                unit_price: item.unitPrice,
                received_qty: item.receivedQty,
                created_at: entity.createdAt,
                updated_at: entity.updatedAt,
            });
        }
    }
    async delete(id) {
        await this.knex('purchase_order_items').where({ purchase_order_id: id }).delete();
        await this.knex('purchase_orders').where({ id }).delete();
    }
    async updateSupplierName(supplierId, supplierName) {
        await this.knex('purchase_orders')
            .where({ supplier_id: supplierId })
            .update({
            supplier_name: supplierName,
            updated_at: new Date().toISOString(),
        });
    }
    async updateStatus(id, status) {
        const order = await this.findById(id);
        if (!order)
            return null;
        const updated = {
            ...order,
            status,
            receivedDate: status === 'received' && !order.receivedDate ? new Date().toISOString() : order.receivedDate,
            updatedAt: new Date().toISOString(),
        };
        await this.save(updated);
        return updated;
    }
    toDomain(row, itemRows) {
        return {
            id: row.id,
            supplierId: row.supplier_id,
            supplierName: row.supplier_name,
            items: itemRows.map((ir) => ({
                id: ir.id,
                materialId: ir.material_id,
                materialName: ir.material_name,
                quantity: Number(ir.quantity),
                unitPrice: Number(ir.unit_price),
                receivedQty: Number(ir.received_qty ?? 0),
            })),
            totalAmount: Number(row.total_amount),
            status: row.status,
            expectedDate: row.expected_date ?? '',
            receivedDate: row.received_date ?? '',
            description: row.description ?? '',
            stockPosted: Boolean(row.stock_posted),
            stockPostedAt: row.stock_posted_at ?? '',
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
    toPersistence(entity) {
        return {
            id: entity.id,
            supplier_id: entity.supplierId,
            supplier_name: entity.supplierName,
            status: entity.status,
            expected_date: entity.expectedDate || null,
            received_date: entity.receivedDate || null,
            total_amount: entity.totalAmount,
            description: entity.description,
            stock_posted: entity.stockPosted ? 1 : 0,
            stock_posted_at: entity.stockPostedAt || null,
            created_at: entity.createdAt,
            updated_at: entity.updatedAt,
        };
    }
}
exports.SqlitePurchaseOrderRepository = SqlitePurchaseOrderRepository;
function buildPurchaseOrderRecord(params) {
    const now = new Date().toISOString();
    return {
        id: params.id ?? (0, types_1.generateId)(),
        supplierId: params.supplierId,
        supplierName: params.supplierName,
        items: params.items.map(item => ({
            id: (0, types_1.generateId)(),
            materialId: item.materialId,
            materialName: item.materialName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            receivedQty: item.receivedQty ?? 0,
        })),
        totalAmount: params.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
        status: params.status ?? 'draft',
        expectedDate: params.expectedDate ?? '',
        receivedDate: params.receivedDate ?? '',
        description: params.description ?? '',
        stockPosted: params.stockPosted ?? false,
        stockPostedAt: params.stockPostedAt ?? '',
        createdAt: params.createdAt ?? now,
        updatedAt: params.updatedAt ?? now,
    };
}
//# sourceMappingURL=sqlite-purchase-order.repository.js.map