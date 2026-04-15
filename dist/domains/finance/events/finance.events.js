"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashBalanceChangedEvent = exports.TransactionCancelledEvent = exports.TransactionCreatedEvent = void 0;
const types_1 = require("@shared/types");
/**
 * Fired when a new transaction is created.
 */
class TransactionCreatedEvent extends types_1.DomainEvent {
    transactionType;
    amount;
    constructor(transactionId, transactionType, amount) {
        super(transactionId, 'TransactionCreated');
        this.transactionType = transactionType;
        this.amount = amount;
    }
}
exports.TransactionCreatedEvent = TransactionCreatedEvent;
/**
 * Fired when a transaction is cancelled.
 */
class TransactionCancelledEvent extends types_1.DomainEvent {
    reason;
    constructor(transactionId, reason) {
        super(transactionId, 'TransactionCancelled');
        this.reason = reason;
    }
}
exports.TransactionCancelledEvent = TransactionCancelledEvent;
/**
 * Fired when cash balance changes.
 */
class CashBalanceChangedEvent extends types_1.DomainEvent {
    newBalance;
    changeAmount;
    isIncome;
    constructor(aggregateId, newBalance, changeAmount, isIncome) {
        super(aggregateId, 'CashBalanceChanged');
        this.newBalance = newBalance;
        this.changeAmount = changeAmount;
        this.isIncome = isIncome;
    }
}
exports.CashBalanceChangedEvent = CashBalanceChangedEvent;
//# sourceMappingURL=finance.events.js.map