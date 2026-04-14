import { Knex } from 'knex';
import { Invoice, InvoiceStatus, InvoiceItem } from '@domains/invoice';
import { IInvoiceRepository } from '@domains/invoice';
import { Money } from '@shared/types';

export class SqliteInvoiceRepository implements IInvoiceRepository {
  constructor(private knex: Knex) {}

  async findById(id: string): Promise<Invoice | null> {
    const row = await this.knex('invoices').where({ id }).first();
    if (!row) return null;

    const items = await this.knex('invoice_items').where({ invoice_id: id });
    return this.toDomain(row, items);
  }

  async findAll(): Promise<Invoice[]> {
    const rows = await this.knex('invoices').orderBy('created_at', 'desc');
    const invoices: Invoice[] = [];

    for (const row of rows) {
      const items = await this.knex('invoice_items').where({ invoice_id: row.id });
      invoices.push(this.toDomain(row, items));
    }

    return invoices;
  }

  async save(entity: Invoice): Promise<void> {
    const existing = await this.knex('invoices').where({ id: entity.id }).first();
    const row = this.toPersistence(entity);

    if (existing) {
      await this.knex('invoices').where({ id: entity.id }).update(row);
    } else {
      await this.knex('invoices').insert(row);
    }

    // Sync items
    await this.knex('invoice_items').where({ invoice_id: entity.id }).delete();
    for (const item of entity.items) {
      await this.knex('invoice_items').insert(this.toItemPersistence(item));
    }
  }

  async delete(id: string): Promise<void> {
    await this.knex('invoice_items').where({ invoice_id: id }).delete();
    await this.knex('invoices').where({ id }).delete();
  }

  async findByStatus(status: InvoiceStatus): Promise<Invoice[]> {
    const rows = await this.knex('invoices').where({ status });
    const invoices: Invoice[] = [];
    for (const row of rows) {
      const items = await this.knex('invoice_items').where({ invoice_id: row.id });
      invoices.push(this.toDomain(row, items));
    }
    return invoices;
  }

  async findByProject(projectId: string): Promise<Invoice[]> {
    const rows = await this.knex('invoices').where({ project_id: projectId });
    const invoices: Invoice[] = [];
    for (const row of rows) {
      const items = await this.knex('invoice_items').where({ invoice_id: row.id });
      invoices.push(this.toDomain(row, items));
    }
    return invoices;
  }

  async findByCustomer(customerId: string): Promise<Invoice[]> {
    const rows = await this.knex('invoices').where({ customer_id: customerId });
    const invoices: Invoice[] = [];
    for (const row of rows) {
      const items = await this.knex('invoice_items').where({ invoice_id: row.id });
      invoices.push(this.toDomain(row, items));
    }
    return invoices;
  }

  async findOverdue(): Promise<Invoice[]> {
    const now = new Date().toISOString();
    const rows = await this.knex('invoices')
      .where('status', 'sent')
      .where('due_date', '<', now);
    const invoices: Invoice[] = [];
    for (const row of rows) {
      const items = await this.knex('invoice_items').where({ invoice_id: row.id });
      invoices.push(this.toDomain(row, items));
    }
    return invoices;
  }

  async findByDateRange(from: Date, to: Date): Promise<Invoice[]> {
    const rows = await this.knex('invoices')
      .whereBetween('created_at', [from.toISOString(), to.toISOString()]);
    const invoices: Invoice[] = [];
    for (const row of rows) {
      const items = await this.knex('invoice_items').where({ invoice_id: row.id });
      invoices.push(this.toDomain(row, items));
    }
    return invoices;
  }

  private toDomain(row: any, itemRows: any[]): Invoice {
    const items = itemRows.map(ir => InvoiceItem.reconstitute({
      id: ir.id,
      invoiceId: ir.invoice_id,
      description: ir.description,
      quantity: parseFloat(ir.quantity),
      unitPrice: Money.create(ir.unit_price, ir.unit_price_currency),
      vatRate: parseFloat(ir.vat_rate),
      totalPrice: Money.create(ir.total_price, ir.total_price_currency),
      vatAmount: Money.create(ir.vat_amount, ir.vat_amount_currency),
      createdAt: new Date(ir.created_at),
      updatedAt: new Date(ir.updated_at),
    }));

    return Invoice.reconstitute({
      id: row.id,
      invoiceNumber: row.invoice_number,
      projectId: row.project_id,
      customerId: row.customer_id,
      customerName: row.customer_name,
      customerAddress: row.customer_address,
      items,
      subtotal: Money.create(row.subtotal, row.subtotal_currency),
      totalVat: Money.create(row.total_vat, row.total_vat_currency),
      totalAmount: Money.create(row.total_amount, row.total_amount_currency),
      dueDate: new Date(row.due_date),
      status: row.status as InvoiceStatus,
      paidDate: row.paid_date ? new Date(row.paid_date) : undefined,
      notes: row.notes,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  private toPersistence(entity: Invoice): Record<string, any> {
    return {
      id: entity.id,
      invoice_number: entity.invoiceNumber,
      project_id: entity.projectId ?? null,
      customer_id: entity.customerId ?? null,
      customer_name: entity.customerName,
      customer_address: entity.customerAddress ?? null,
      subtotal: entity.subtotal.amountDecimal,
      subtotal_currency: entity.subtotal.currency,
      total_vat: entity.totalVat.amountDecimal,
      total_vat_currency: entity.totalVat.currency,
      total_amount: entity.totalAmount.amountDecimal,
      total_amount_currency: entity.totalAmount.currency,
      due_date: entity.dueDate.toISOString(),
      status: entity.status,
      paid_date: entity.paidDate?.toISOString() ?? null,
      notes: entity.notes ?? null,
      created_by: entity.createdBy,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString(),
    };
  }

  private toItemPersistence(item: InvoiceItem): Record<string, any> {
    return {
      id: item.id,
      invoice_id: item.invoiceId,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice.amountDecimal,
      unit_price_currency: item.unitPrice.currency,
      vat_rate: item.vatRate,
      total_price: item.totalPrice.amountDecimal,
      total_price_currency: item.totalPrice.currency,
      vat_amount: item.vatAmount.amountDecimal,
      vat_amount_currency: item.vatAmount.currency,
      created_at: item.createdAt.toISOString(),
      updated_at: item.updatedAt.toISOString(),
    };
  }
}
