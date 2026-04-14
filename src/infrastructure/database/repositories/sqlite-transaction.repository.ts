import { Knex } from 'knex';
import { Transaction, TransactionType, PaymentMethod, TransactionStatus } from '@domains/finance';
import { ITransactionRepository } from '@domains/finance';
import { Money } from '@shared/types';

/**
 * SQLite implementation of Transaction repository.
 */
export class SqliteTransactionRepository implements ITransactionRepository {
  constructor(private knex: Knex) {}

  async findById(id: string): Promise<Transaction | null> {
    const row = await this.knex('transactions').where({ id }).first();
    return row ? this.toDomain(row) : null;
  }

  async findAll(): Promise<Transaction[]> {
    const rows = await this.knex('transactions').orderBy('created_at', 'desc');
    return rows.map((r: any) => this.toDomain(r));
  }

  async save(entity: Transaction): Promise<void> {
    const existing = await this.knex('transactions').where({ id: entity.id }).first();
    const row = this.toPersistence(entity);

    if (existing) {
      await this.knex('transactions').where({ id: entity.id }).update(row);
    } else {
      await this.knex('transactions').insert(row);
    }
  }

  async delete(id: string): Promise<void> {
    // RULE: Transactions are NEVER deleted, only cancelled
    throw new Error('Transactions cannot be deleted. Use cancel() instead.');
  }

  async findByStatus(status: TransactionStatus): Promise<Transaction[]> {
    const rows = await this.knex('transactions').where({ status });
    return rows.map((r: any) => this.toDomain(r));
  }

  async findByType(type: TransactionType): Promise<Transaction[]> {
    const rows = await this.knex('transactions').where({ type });
    return rows.map((r: any) => this.toDomain(r));
  }

  async findByProject(projectId: string): Promise<Transaction[]> {
    const rows = await this.knex('transactions').where({ related_project_id: projectId });
    return rows.map((r: any) => this.toDomain(r));
  }

  async findByDateRange(from: Date, to: Date): Promise<Transaction[]> {
    const rows = await this.knex('transactions')
      .whereBetween('created_at', [from.toISOString(), to.toISOString()])
      .orderBy('created_at', 'desc');
    return rows.map((r: any) => this.toDomain(r));
  }

  async findByPaymentMethod(method: PaymentMethod): Promise<Transaction[]> {
    const rows = await this.knex('transactions').where({ payment_method: method });
    return rows.map((r: any) => this.toDomain(r));
  }

  async findActive(): Promise<Transaction[]> {
    return this.findByStatus(TransactionStatus.ACTIVE);
  }

  // --- Mapping helpers ---

  private toDomain(row: any): Transaction {
    return Transaction.reconstitute({
      id: row.id,
      amount: Money.create(row.amount, row.amount_currency),
      vatAmount: Money.create(row.vat_amount, row.vat_currency),
      type: row.type as TransactionType,
      paymentMethod: row.payment_method as PaymentMethod,
      isInvoiced: Boolean(row.is_invoiced),
      description: row.description,
      createdBy: row.created_by,
      relatedProjectId: row.related_project_id,
      status: row.status as TransactionStatus,
      cancellationReason: row.cancellation_reason,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  private toPersistence(entity: Transaction): Record<string, any> {
    return {
      id: entity.id,
      amount: entity.amount.amountDecimal,
      amount_currency: entity.amount.currency,
      vat_amount: entity.vatAmount.amountDecimal,
      vat_currency: entity.vatAmount.currency,
      type: entity.type,
      payment_method: entity.paymentMethod,
      is_invoiced: entity.isInvoiced ? 1 : 0,
      description: entity.description,
      created_by: entity.createdBy,
      related_project_id: entity.relatedProjectId ?? null,
      status: entity.status,
      cancellation_reason: entity.cancellationReason ?? null,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString(),
    };
  }
}
