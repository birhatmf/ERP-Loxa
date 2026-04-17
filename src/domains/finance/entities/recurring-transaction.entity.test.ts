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

  it('updates editable fields and recalculates schedule', () => {
    const item = RecurringTransaction.create({
      description: 'Aylık bakım',
      amount: 1000,
      type: TransactionType.EXPENSE,
      category: 'service',
      paymentMethod: 'nakit',
      frequency: RecurringFrequency.MONTHLY,
      dayOfMonth: 10,
    });

    item.updateInfo({
      description: 'Aylık bakım paketi',
      amount: 1500,
      category: 'maintenance',
      paymentMethod: 'kart',
      frequency: RecurringFrequency.QUARTERLY,
      dayOfMonth: 15,
      isActive: false,
    });

    expect(item.description).toBe('Aylık bakım paketi');
    expect(item.amount.amount).toBe(1500);
    expect(item.category).toBe('maintenance');
    expect(item.paymentMethod).toBe('kart');
    expect(item.frequency).toBe(RecurringFrequency.QUARTERLY);
    expect(item.dayOfMonth).toBe(15);
    expect(item.isActive).toBe(false);
  });
});
