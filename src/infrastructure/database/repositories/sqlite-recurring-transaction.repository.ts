import { Knex } from 'knex';
import { RecurringTransaction } from '@domains/finance/entities/recurring-transaction.entity';
import { RecurringFrequency } from '@domains/finance/entities/recurring-transaction.enums';
import { TransactionType } from '@domains/finance/entities/transaction.enums';
import { IRecurringTransactionRepository } from '@domains/finance/repositories/recurring-transaction.repository';
import { Money } from '@shared/types';

export class SqliteRecurringTransactionRepository implements IRecurringTransactionRepository {
  constructor(private knex: Knex) {}

  async findById(id: string): Promise<RecurringTransaction | null> {
    const row = await this.knex('recurring_transactions').where({ id }).first();
    return row ? this.toDomain(row) : null;
  }

  async findAll(): Promise<RecurringTransaction[]> {
    const rows = await this.knex('recurring_transactions').orderBy('next_run', 'asc');
    return rows.map((row: any) => this.toDomain(row));
  }

  async save(entity: RecurringTransaction): Promise<void> {
    const existing = await this.knex('recurring_transactions').where({ id: entity.id }).first();
    const row = this.toPersistence(entity);

    if (existing) {
      await this.knex('recurring_transactions').where({ id: entity.id }).update(row);
    } else {
      await this.knex('recurring_transactions').insert(row);
    }
  }

  async delete(id: string): Promise<void> {
    await this.knex('recurring_transactions').where({ id }).delete();
  }

  async findActive(): Promise<RecurringTransaction[]> {
    const rows = await this.knex('recurring_transactions').where({ is_active: 1 }).orderBy('next_run', 'asc');
    return rows.map((row: any) => this.toDomain(row));
  }

  async findDue(now: Date = new Date()): Promise<RecurringTransaction[]> {
    const rows = await this.knex('recurring_transactions')
      .where({ is_active: 1 })
      .andWhere('next_run', '<=', now.toISOString())
      .orderBy('next_run', 'asc');
    return rows.map((row: any) => this.toDomain(row));
  }

  private toDomain(row: any): RecurringTransaction {
    return RecurringTransaction.reconstitute({
      id: row.id,
      description: row.description,
      amount: Money.create(row.amount, row.amount_currency),
      type: row.type as TransactionType,
      category: row.category,
      paymentMethod: row.payment_method,
      frequency: row.frequency as RecurringFrequency,
      dayOfMonth: Number(row.day_of_month),
      isActive: Boolean(row.is_active),
      nextRun: new Date(row.next_run),
      lastRun: row.last_run ? new Date(row.last_run) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  private toPersistence(entity: RecurringTransaction): Record<string, any> {
    return {
      id: entity.id,
      description: entity.description,
      amount: entity.amount.amountDecimal,
      amount_currency: entity.amount.currency,
      type: entity.type,
      category: entity.category,
      payment_method: entity.paymentMethod,
      frequency: entity.frequency,
      day_of_month: entity.dayOfMonth,
      is_active: entity.isActive ? 1 : 0,
      next_run: entity.nextRun.toISOString(),
      last_run: entity.lastRun?.toISOString() ?? null,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString(),
    };
  }
}

