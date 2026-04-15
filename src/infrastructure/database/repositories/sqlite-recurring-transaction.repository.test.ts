import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import knex, { Knex } from 'knex';
import { up as createRecurringTransactions } from '../migrations/003_add_recurring_transactions_table';
import { SqliteRecurringTransactionRepository } from './sqlite-recurring-transaction.repository';
import { RecurringTransaction, RecurringFrequency, TransactionType } from '@domains/finance';

describe('SqliteRecurringTransactionRepository', () => {
  let db: Knex;

  beforeAll(async () => {
    db = knex({
      client: 'better-sqlite3',
      connection: { filename: ':memory:' },
      useNullAsDefault: true,
    });
    await createRecurringTransactions(db);
  });

  afterAll(async () => {
    await db.destroy();
  });

  it('saves, reads, updates and deletes recurring transactions', async () => {
    const repo = new SqliteRecurringTransactionRepository(db);
    const item = RecurringTransaction.create({
      description: 'Aylık servis',
      amount: 750,
      type: TransactionType.EXPENSE,
      category: 'service',
      paymentMethod: 'havale',
      frequency: RecurringFrequency.MONTHLY,
      dayOfMonth: 10,
    });

    await repo.save(item);

    const fetched = await repo.findById(item.id);
    expect(fetched?.description).toBe('Aylık servis');
    expect(await repo.findAll()).toHaveLength(1);

    fetched?.setActive(false);
    if (fetched) await repo.save(fetched);

    const active = await repo.findActive();
    expect(active).toHaveLength(0);

    await repo.delete(item.id);
    expect(await repo.findAll()).toHaveLength(0);
  });
});

