import { describe, it, expect } from 'vitest';
import { Money } from '@shared/types/money.vo';

describe('Money Value Object', () => {
  it('should create money with correct amount', () => {
    const money = Money.create(100.50);
    expect(money.amount).toBe(100.50);
    expect(money.currency).toBe('TRY');
  });

  it('should create money from string', () => {
    const money = Money.create('1234.56');
    expect(money.amountDecimal).toBe('1234.56');
  });

  it('should add two money values', () => {
    const a = Money.create(100);
    const b = Money.create(50);
    const result = a.add(b);
    expect(result.amount).toBe(150);
  });

  it('should subtract two money values', () => {
    const a = Money.create(100);
    const b = Money.create(30);
    const result = a.subtract(b);
    expect(result.amount).toBe(70);
  });

  it('should multiply by factor', () => {
    const money = Money.create(100);
    const result = money.multiply(2.5);
    expect(result.amount).toBe(250);
  });

  it('should handle floating point correctly', () => {
    const a = Money.create(0.1);
    const b = Money.create(0.2);
    const result = a.add(b);
    expect(result.amountDecimal).toBe('0.30');
  });

  it('should throw on currency mismatch', () => {
    const try_ = Money.create(100, 'TRY');
    const usd = Money.create(100, 'USD');
    expect(() => try_.add(usd)).toThrow('Currency mismatch');
  });

  it('should detect zero', () => {
    const zero = Money.zero();
    expect(zero.isZero()).toBe(true);
  });

  it('should detect negative', () => {
    const neg = Money.create(-50);
    expect(neg.isNegative()).toBe(true);
  });

  it('should compare greater than', () => {
    const a = Money.create(100);
    const b = Money.create(50);
    expect(a.isGreaterThan(b)).toBe(true);
    expect(b.isGreaterThan(a)).toBe(false);
  });

  it('should be equal by value', () => {
    const a = Money.create(100);
    const b = Money.create(100);
    expect(a.equals(b)).toBe(true);
  });
});
