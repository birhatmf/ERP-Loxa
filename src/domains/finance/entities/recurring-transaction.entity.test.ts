import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RecurringTransaction, RecurringFrequency, TransactionType } from '@domains/finance';

describe('RecurringTransaction Entity', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-15T10:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates a recurring transaction with computed next run', () => {
    const item = RecurringTransaction.create({
      description: 'Aylık kira',
      amount: 12500,
      type: TransactionType.EXPENSE,
      category: 'rent',
      paymentMethod: 'havale',
      frequency: RecurringFrequency.MONTHLY,
      dayOfMonth: 5,
    });

    expect(item.isActive).toBe(true);
    expect(item.category).toBe('rent');
    expect(item.nextRun).toBeInstanceOf(Date);
    expect(item.nextRun.getMonth()).toBe(4);
    expect(item.nextRun.getDate()).toBe(5);
  });

  it('updates run dates when executed', () => {
    const item = RecurringTransaction.create({
      description: 'Haftalık servis',
      amount: 500,
      type: TransactionType.EXPENSE,
      category: 'service',
      paymentMethod: 'nakit',
      frequency: RecurringFrequency.WEEKLY,
      dayOfMonth: 1,
    });

    item.markRun(new Date('2026-04-15T10:00:00.000Z'));

    expect(item.lastRun?.toISOString()).toBe('2026-04-15T10:00:00.000Z');
    expect(item.nextRun.getTime()).toBeGreaterThan(item.lastRun!.getTime());
  });
});

