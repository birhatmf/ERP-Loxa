import { ValueObject } from './value-object.base';
interface MoneyProps {
    readonly amount: string;
    readonly currency: string;
}
/**
 * Money Value Object.
 * Represents monetary amounts with currency.
 * Uses string-based decimal arithmetic to avoid floating point errors.
 */
export declare class Money extends ValueObject<MoneyProps> {
    private constructor();
    static create(amount: number | string, currency?: string): Money;
    static zero(currency?: string): Money;
    get amount(): number;
    get amountDecimal(): string;
    get currency(): string;
    add(other: Money): Money;
    subtract(other: Money): Money;
    multiply(factor: number): Money;
    isGreaterThan(other: Money): boolean;
    isLessThan(other: Money): boolean;
    isZero(): boolean;
    isNegative(): boolean;
    private assertSameCurrency;
    private static parseDecimal;
    toString(): string;
}
export {};
//# sourceMappingURL=money.vo.d.ts.map