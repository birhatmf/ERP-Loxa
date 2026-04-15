import { Knex } from 'knex';

export interface SupplierRecord {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  taxId: string;
  notes: string;
  totalOrders?: number;
  createdAt: Date;
  updatedAt: Date;
}

export class SqliteSupplierRepository {
  constructor(private knex: Knex) {}

  async findById(id: string): Promise<SupplierRecord | null> {
    const row = await this.knex('suppliers').where({ id }).first();
    return row ? this.toDomain(row) : null;
  }

  async findAll(): Promise<SupplierRecord[]> {
    const rows = await this.knex('suppliers').orderBy('created_at', 'desc');
    const suppliers: SupplierRecord[] = [];

    for (const row of rows) {
      const totalOrdersRow = await this.knex('purchase_orders')
        .where({ supplier_id: row.id })
        .count<{ total: string }[]>({ total: 'id' })
        .first();

      suppliers.push({
        ...this.toDomain(row),
        totalOrders: Number(totalOrdersRow?.total ?? 0),
      });
    }

    return suppliers;
  }

  async save(entity: SupplierRecord): Promise<void> {
    const existing = await this.knex('suppliers').where({ id: entity.id }).first();
    const row = this.toPersistence(entity);
    if (existing) {
      await this.knex('suppliers').where({ id: entity.id }).update(row);
    } else {
      await this.knex('suppliers').insert(row);
    }
  }

  async delete(id: string): Promise<void> {
    await this.knex('suppliers').where({ id }).delete();
  }

  private toDomain(row: any): SupplierRecord {
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

  private toPersistence(entity: SupplierRecord): Record<string, any> {
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
