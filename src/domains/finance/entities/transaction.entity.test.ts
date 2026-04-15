import { describe, it, expect } from 'vitest';
import { Transaction, TransactionType, PaymentMethod, TransactionStatus } from '@domains/finance';
import { Money } from '@shared/types/money.vo';

describe('Transaction Entity', () => {
  it('should create a new income transaction', () => {
    const tx = Transaction.create({
      amount: Money.create(1000),
      vatAmount: Money.create(180),
      type: TransactionType.INCOME,
      paymentMethod: PaymentMethod.CASH,
      isInvoiced: false,
      description: 'Test income',
      createdBy: 'test-user',
    });

    expect(tx.amount.amount).toBe(1000);
    expect(tx.vatAmount.amount).toBe(180);
    expect(tx.totalWithVat.amount).toBe(1180);
    expect(tx.type).toBe(TransactionType.INCOME);
    expect(tx.paymentMethod).toBe(PaymentMethod.CASH);
    expect(tx.status).toBe(TransactionStatus.ACTIVE);
    expect(tx.isActive).toBe(true);
  });

  it('should create a new expense transaction', () => {
    const tx = Transaction.create({
      amount: Money.create(500),
      vatAmount: Money.create(90),
      type: TransactionType.EXPENSE,
      paymentMethod: PaymentMethod.TRANSFER,
      isInvoiced: true,
      description: 'Test expense',
      createdBy: 'test-user',
    });

    expect(tx.type).toBe(TransactionType.EXPENSE);
    expect(tx.isInvoiced).toBe(true);
  });

  it('should throw on zero amount', () => {
    expect(() => Transaction.create({
      amount: Money.create(0),
      vatAmount: Money.create(0),
      type: TransactionType.INCOME,
      paymentMethod: PaymentMethod.CASH,
      isInvoiced: false,
      description: 'Invalid',
      createdBy: 'test',
    })).toThrow('Transaction amount must be positive');
  });

  it('should throw on negative amount', () => {
    expect(() => Transaction.create({
      amount: Money.create(-100),
      vatAmount: Money.create(0),
      type: TransactionType.INCOME,
      paymentMethod: PaymentMethod.CASH,
      isInvoiced: false,
      description: 'Invalid',
      createdBy: 'test',
    })).toThrow('Transaction amount must be positive');
  });

  it('should cancel an active transaction', () => {
    const tx = Transaction.create({
      amount: Money.create(1000),
      vatAmount: Money.create(180),
      type: TransactionType.INCOME,
      paymentMethod: PaymentMethod.CASH,
      isInvoiced: false,
      description: 'Test',
      createdBy: 'test',
    });

    tx.cancel('Müşteri iptal etti');

    expect(tx.status).toBe(TransactionStatus.CANCELLED);
    expect(tx.cancellationReason).toBe('Müşteri iptal etti');
    expect(tx.isActive).toBe(false);
  });

  it('should not cancel an already cancelled transaction', () => {
    const tx = Transaction.create({
      amount: Money.create(1000),
      vatAmount: Money.create(180),
      type: TransactionType.INCOME,
      paymentMethod: PaymentMethod.CASH,
      isInvoiced: false,
      description: 'Test',
      createdBy: 'test',
    });

    tx.cancel('First cancel');

    expect(() => tx.cancel('Second cancel')).toThrow('Transaction is already cancelled');
  });

  it('should emit domain event on creation', () => {
    const tx = Transaction.create({
      amount: Money.create(1000),
      vatAmount: Money.create(180),
      type: TransactionType.INCOME,
      paymentMethod: PaymentMethod.CASH,
      isInvoiced: false,
      description: 'Test',
      createdBy: 'test',
    });

    expect(tx.domainEvents).toHaveLength(1);
    expect(tx.domainEvents[0].eventName).toBe('TransactionCreated');
  });

  it('should emit domain event on cancellation', () => {
    const tx = Transaction.create({
      amount: Money.create(1000),
      vatAmount: Money.create(180),
      type: TransactionType.INCOME,
      paymentMethod: PaymentMethod.CASH,
      isInvoiced: false,
      description: 'Test',
      createdBy: 'test',
    });

    tx.clearEvents();
    tx.cancel('Test cancel');

    expect(tx.domainEvents).toHaveLength(1);
    expect(tx.domainEvents[0].eventName).toBe('TransactionCancelled');
  });

  it('should update editable details on active transaction', () => {
    const tx = Transaction.create({
      amount: Money.create(1000),
      vatAmount: Money.create(180),
      type: TransactionType.INCOME,
      paymentMethod: PaymentMethod.CASH,
      isInvoiced: false,
      description: 'Test',
      createdBy: 'test',
    });

    tx.updateDetails({
      amount: Money.create(1500),
      vatAmount: Money.create(270),
      type: TransactionType.EXPENSE,
      paymentMethod: PaymentMethod.TRANSFER,
      isInvoiced: true,
      description: 'Updated',
    });

    expect(tx.amount.amount).toBe(1500);
    expect(tx.vatAmount.amount).toBe(270);
    expect(tx.type).toBe(TransactionType.EXPENSE);
    expect(tx.paymentMethod).toBe(PaymentMethod.TRANSFER);
    expect(tx.isInvoiced).toBe(true);
    expect(tx.description).toBe('Updated');
  });

  it('should not edit cancelled transaction', () => {
    const tx = Transaction.create({
      amount: Money.create(1000),
      vatAmount: Money.create(180),
      type: TransactionType.INCOME,
      paymentMethod: PaymentMethod.CASH,
      isInvoiced: false,
      description: 'Test',
      createdBy: 'test',
    });

    tx.cancel('remove');

    expect(() => tx.updateDetails({ description: 'X' })).toThrow('Cancelled transactions cannot be edited');
  });
});
