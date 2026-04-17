import { Knex } from 'knex';
import { Sale, SaleItem, SaleStatus } from '@domains/sale/entities/sale.entity';
import { ISaleRepository } from '@domains/sale/repositories/sale.repository';
import { Money } from '@shared/types';

interface SaleRow {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  total_amount: string;
  payment_status: string;
  payment_method: string;
  payment_note: string;
  description: string;
  created_at: Date;
  updated_at: Date;
}

interface SaleItemRow {
  id: string;
  sale_id: string;
  description: string;
  quantity: string;
  unit_price: string;
  total_price: string;
  created_at: Date;
  updated_at: Date;
}

export class SqliteSaleRepository implements ISaleRepository {
  constructor(private knex: Knex) {}

  async findById(id: string): Promise<Sale | null> {
    const row: SaleRow | undefined = await this.knex('sales').where({ id }).first();
    if (!row) return null;

    const itemRows: SaleItemRow[] = await this.knex('sale_items').where({ sale_id: id });
    const items = itemRows.map(r => this.toSaleItem(r));

    return this.toDomain(row, items);
  }

  async findAll(): Promise<Sale[]> {
    const rows: SaleRow[] = await this.knex('sales').orderBy('created_at', 'desc');
    const sales: Sale[] = [];

    for (const row of rows) {
      const itemRows: SaleItemRow[] = await this.knex('sale_items').where({ sale_id: row.id });
      sales.push(this.toDomain(row, itemRows.map(r => this.toSaleItem(r))));
    }

    return sales;
  }

  async save(entity: Sale): Promise<void> {
    const existing = await this.knex('sales').where({ id: entity.id }).first();
    const saleRow = this.toSalePersistence(entity);

    if (existing) {
      await this.knex('sales').where({ id: entity.id }).update(saleRow);
    } else {
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

  async delete(id: string): Promise<void> {
    await this.knex('sale_items').where({ sale_id: id }).delete();
    await this.knex('sales').where({ id }).delete();
  }

  private toDomain(row: SaleRow, items: SaleItem[]): Sale {
    return Sale.reconstitute({
      id: row.id,
      customerName: row.customer_name,
      customerPhone: row.customer_phone ?? '',
      customerAddress: row.customer_address ?? '',
      items,
      totalAmount: Money.create(parseFloat(row.total_amount)),
      paymentStatus: row.payment_status as SaleStatus,
      paymentMethod: row.payment_method,
      paymentNote: row.payment_note ?? '',
      description: row.description ?? '',
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  private toSaleItem(row: SaleItemRow): SaleItem {
    return SaleItem.reconstitute({
      id: row.id,
      description: row.description,
      quantity: parseFloat(row.quantity),
      unitPrice: Money.create(parseFloat(row.unit_price)),
      totalPrice: Money.create(parseFloat(row.total_price)),
    });
  }

  private toSalePersistence(entity: Sale): Record<string, any> {
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
