import { Knex } from 'knex';
import { generateId } from '@shared/types';

export interface PurchaseOrderItemRecord {
  id: string;
  materialId: string;
  materialName: string;
  quantity: number;
  unitPrice: number;
  receivedQty: number;
}

export interface PurchaseOrderRecord {
  id: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseOrderItemRecord[];
  totalAmount: number;
  status: 'draft' | 'sent' | 'confirmed' | 'received' | 'cancelled';
  expectedDate: string;
  receivedDate: string;
  description: string;
  stockPosted: boolean;
  stockPostedAt: string;
  createdAt: string;
  updatedAt: string;
}

type PurchaseOrderStatus = PurchaseOrderRecord['status'];

export class SqlitePurchaseOrderRepository {
  constructor(private knex: Knex) {}

  async findById(id: string): Promise<PurchaseOrderRecord | null> {
    const row = await this.knex('purchase_orders').where({ id }).first();
    if (!row) return null;
    const items = await this.knex('purchase_order_items').where({ purchase_order_id: id }).orderBy('created_at', 'asc');
    return this.toDomain(row, items);
  }

  async findAll(): Promise<PurchaseOrderRecord[]> {
    const rows = await this.knex('purchase_orders').orderBy('created_at', 'desc');
    const orders: PurchaseOrderRecord[] = [];
    for (const row of rows) {
      const items = await this.knex('purchase_order_items').where({ purchase_order_id: row.id }).orderBy('created_at', 'asc');
      orders.push(this.toDomain(row, items));
    }
    return orders;
  }

  async save(entity: PurchaseOrderRecord): Promise<void> {
    const existing = await this.knex('purchase_orders').where({ id: entity.id }).first();
    const row = this.toPersistence(entity);

    if (existing) {
      await this.knex('purchase_orders').where({ id: entity.id }).update(row);
    } else {
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

  async delete(id: string): Promise<void> {
    await this.knex('purchase_order_items').where({ purchase_order_id: id }).delete();
    await this.knex('purchase_orders').where({ id }).delete();
  }

  async updateSupplierName(supplierId: string, supplierName: string): Promise<void> {
    await this.knex('purchase_orders')
      .where({ supplier_id: supplierId })
      .update({
        supplier_name: supplierName,
        updated_at: new Date().toISOString(),
      });
  }

  async updateStatus(id: string, status: PurchaseOrderStatus): Promise<PurchaseOrderRecord | null> {
    const order = await this.findById(id);
    if (!order) return null;
    const updated: PurchaseOrderRecord = {
      ...order,
      status,
      receivedDate: status === 'received' && !order.receivedDate ? new Date().toISOString() : order.receivedDate,
      updatedAt: new Date().toISOString(),
    };
    await this.save(updated);
    return updated;
  }

  private toDomain(row: any, itemRows: any[]): PurchaseOrderRecord {
    return {
      id: row.id,
      supplierId: row.supplier_id,
      supplierName: row.supplier_name,
      items: itemRows.map((ir: any) => ({
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

  private toPersistence(entity: PurchaseOrderRecord): Record<string, any> {
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

export function buildPurchaseOrderRecord(params: {
  id?: string;
  supplierId: string;
  supplierName: string;
  items: Array<{ materialId: string; materialName: string; quantity: number; unitPrice: number; receivedQty?: number }>;
  status?: PurchaseOrderStatus;
  expectedDate?: string;
  receivedDate?: string;
  description?: string;
  stockPosted?: boolean;
  stockPostedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}): PurchaseOrderRecord {
  const now = new Date().toISOString();
  return {
    id: params.id ?? generateId(),
    supplierId: params.supplierId,
    supplierName: params.supplierName,
    items: params.items.map(item => ({
      id: generateId(),
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
