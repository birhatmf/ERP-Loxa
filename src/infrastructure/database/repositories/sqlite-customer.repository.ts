import { Knex } from 'knex';
import { Customer } from '@domains/customer';
import { ICustomerRepository } from '@domains/customer/repositories/customer.repository';
import { Money } from '@shared/types';

export class SqliteCustomerRepository implements ICustomerRepository {
  constructor(private knex: Knex) {}

  async findById(id: string): Promise<Customer | null> {
    const row = await this.knex('customers').where({ id }).first();
    return row ? this.toDomain(row) : null;
  }

  async findAll(): Promise<Customer[]> {
    const rows = await this.knex('customers').orderBy('created_at', 'desc');
    return rows.map((row: any) => this.toDomain(row));
  }

  async save(entity: Customer): Promise<void> {
    const existing = await this.knex('customers').where({ id: entity.id }).first();
    const row = this.toPersistence(entity);

    if (existing) {
      await this.knex('customers').where({ id: entity.id }).update(row);
    } else {
      await this.knex('customers').insert(row);
    }
  }

  async delete(id: string): Promise<void> {
    await this.knex('customers').where({ id }).delete();
  }

  private toDomain(row: any): Customer {
    return Customer.reconstitute({
      id: row.id,
      name: row.name,
      phone: row.phone ?? '',
      email: row.email ?? '',
      address: row.address ?? '',
      taxId: row.tax_id ?? '',
      notes: row.notes ?? '',
      totalPurchases: Money.create(row.total_purchases ?? 0),
      outstandingBalance: Money.create(row.outstanding_balance ?? 0),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  private toPersistence(entity: Customer): Record<string, any> {
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
