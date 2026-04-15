"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Money = void 0;
const value_object_base_1 = require("./value-object.base");
/**
 * Money Value Object.
 * Represents monetary amounts with currency.
 * Uses string-based decimal arithmetic to avoid floating point errors.
 */
class Money extends value_object_base_1.ValueObject {
    constructor(props) {
        super(props);
    }
    static create(amount, currency = 'TRY') {
        const normalizedAmount = typeof amount === 'number'
            ? amount.toFixed(2)
            : Money.parseDecimal(amount);
        return new Money({ amount: normalizedAmount, currency });
    }
    static zero(currency = 'TRY') {
        return new Money({ amount: '0.00', currency });
    }
    get amount() {
        return parseFloat(this.props.amount);
    }
    get amountDecimal() {
        return this.props.amount;
    }
    get currency() {
        return this.props.currency;
    }
    add(other) {
        this.assertSameCurrency(other);
        const result = (this.amount * 100 + other.amount * 100) / 100;
        return Money.create(result, this.currency);
    }
    subtract(other) {
        this.assertSameCurrency(other);
        const result = (this.amount * 100 - other.amount * 100) / 100;
        return Money.create(result, this.currency);
    }
    multiply(factor) {
        const result = Math.round(this.amount * 100 * factor) / 100;
        return Money.create(result, this.currency);
    }
    isGreaterThan(other) {
        this.assertSameCurrency(other);
        return this.amount > other.amount;
    }
    isLessThan(other) {
        this.assertSameCurrency(other);
        return this.amount < other.amount;
    }
    isZero() {
        return this.amount === 0;
    }
    isNegative() {
        return this.amount < 0;
    }
    assertSameCurrency(other) {
        if (this.currency !== other.currency) {
            throw new Error(`Currency mismatch: ${this.currency} vs ${other.currency}`);
        }
    }
    static parseDecimal(value) {
        const num = parseFloat(value);
        if (isNaN(num)) {
            throw new Error(`Invalid money amount: ${value}`);
        }
        return num.toFixed(2);
    }
    toString() {
        return `${this.amount} ${this.currency}`;
    }
}
exports.Money = Money;
//# sourceMappingURL=money.vo.js.map