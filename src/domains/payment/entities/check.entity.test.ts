import { describe, it, expect } from 'vitest';
import { Check, CheckType, CheckStatus } from '@domains/payment';
import { Money } from '@shared/types/money.vo';

describe('Check Entity', () => {
  it('should create a received check', () => {
    const check = Check.create({
      type: CheckType.RECEIVED,
      amount: Money.create(5000),
      dueDate: new Date('2026-05-15'),
      ownerName: 'Ahmet Yılmaz',
      checkNumber: '123456',
      bankName: 'Garanti BBVA',
    });

    expect(check.type).toBe(CheckType.RECEIVED);
    expect(check.amount.amount).toBe(5000);
    expect(check.status).toBe(CheckStatus.PENDING);
    expect(check.isPending).toBe(true);
  });

  it('should mark check as paid', () => {
    const check = Check.create({
      type: CheckType.RECEIVED,
      amount: Money.create(5000),
      dueDate: new Date(),
      ownerName: 'Test',
    });

    check.markAsPaid();

    expect(check.status).toBe(CheckStatus.PAID);
    expect(check.isPaid).toBe(true);
    expect(check.paidDate).toBeDefined();
  });

  it('should not pay a non-pending check', () => {
    const check = Check.create({
      type: CheckType.RECEIVED,
      amount: Money.create(5000),
      dueDate: new Date(),
      ownerName: 'Test',
    });

    check.markAsPaid();

    expect(() => check.markAsPaid()).toThrow('Cannot mark check as paid');
  });

  it('should bounce a check', () => {
    const check = Check.create({
      type: CheckType.RECEIVED,
      amount: Money.create(5000),
      dueDate: new Date(),
      ownerName: 'Test',
    });

    check.markAsBounced();

    expect(check.status).toBe(CheckStatus.BOUNCED);
  });

  it('should cancel a check', () => {
    const check = Check.create({
      type: CheckType.RECEIVED,
      amount: Money.create(5000),
      dueDate: new Date(),
      ownerName: 'Test',
    });

    check.cancel();

    expect(check.status).toBe(CheckStatus.CANCELLED);
  });

  it('should detect overdue checks', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);

    const check = Check.create({
      type: CheckType.RECEIVED,
      amount: Money.create(5000),
      dueDate: pastDate,
      ownerName: 'Test',
    });

    expect(check.isOverdue).toBe(true);
  });

  it('should throw on zero amount', () => {
    expect(() => Check.create({
      type: CheckType.RECEIVED,
      amount: Money.create(0),
      dueDate: new Date(),
      ownerName: 'Test',
    })).toThrow('Check amount must be positive');
  });
});
