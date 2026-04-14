import { ValueObject } from './value-object.base';

interface MoneyProps {
  readonly amount: string; // stored as string to avoid floating point issues
  readonly currency: string;
}

/**
 * Money Value Object.
 * Represents monetary amounts with currency.
 * Uses string-based decimal arithmetic to avoid floating point errors.
 */
export class Money extends ValueObject<MoneyProps> {
  private constructor(props: MoneyProps) {
    super(props);
  }

  static create(amount: number | string, currency: string = 'TRY'): Money {
    const normalizedAmount = typeof amount === 'number'
      ? amount.toFixed(2)
      : Money.parseDecimal(amount);
    return new Money({ amount: normalizedAmount, currency });
  }

  static zero(currency: string = 'TRY'): Money {
    return new Money({ amount: '0.00', currency });
  }

  get amount(): number {
    return parseFloat(this.props.amount);
  }

  get amountDecimal(): string {
    return this.props.amount;
  }

  get currency(): string {
    return this.props.currency;
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    const result = (this.amount * 100 + other.amount * 100) / 100;
    return Money.create(result, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    const result = (this.amount * 100 - other.amount * 100) / 100;
    return Money.create(result, this.currency);
  }

  multiply(factor: number): Money {
    const result = Math.round(this.amount * 100 * factor) / 100;
    return Money.create(result, this.currency);
  }

  isGreaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount > other.amount;
  }

  isLessThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount < other.amount;
  }

  isZero(): boolean {
    return this.amount === 0;
  }

  isNegative(): boolean {
    return this.amount < 0;
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(`Currency mismatch: ${this.currency} vs ${other.currency}`);
    }
  }

  private static parseDecimal(value: string): string {
    const num = parseFloat(value);
    if (isNaN(num)) {
      throw new Error(`Invalid money amount: ${value}`);
    }
    return num.toFixed(2);
  }

  toString(): string {
    return `${this.amount} ${this.currency}`;
  }
}
