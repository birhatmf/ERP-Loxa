"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckOverdueEvent = exports.CheckCancelledEvent = exports.CheckBouncedEvent = exports.CheckPaidEvent = exports.CheckCreatedEvent = void 0;
const types_1 = require("@shared/types");
/**
 * Fired when a new check is created.
 */
class CheckCreatedEvent extends types_1.DomainEvent {
    checkType;
    amount;
    dueDate;
    constructor(checkId, checkType, amount, dueDate) {
        super(checkId, 'CheckCreated');
        this.checkType = checkType;
        this.amount = amount;
        this.dueDate = dueDate;
    }
}
exports.CheckCreatedEvent = CheckCreatedEvent;
/**
 * Fired when a check is paid.
 * This triggers creation of a corresponding Transaction.
 */
class CheckPaidEvent extends types_1.DomainEvent {
    checkType;
    amount;
    paidDate;
    constructor(checkId, checkType, amount, paidDate) {
        super(checkId, 'CheckPaid');
        this.checkType = checkType;
        this.amount = amount;
        this.paidDate = paidDate;
    }
}
exports.CheckPaidEvent = CheckPaidEvent;
/**
 * Fired when a check bounces (karşılıksız).
 */
class CheckBouncedEvent extends types_1.DomainEvent {
    amount;
    ownerName;
    constructor(checkId, amount, ownerName) {
        super(checkId, 'CheckBounced');
        this.amount = amount;
        this.ownerName = ownerName;
    }
}
exports.CheckBouncedEvent = CheckBouncedEvent;
/**
 * Fired when a check is cancelled.
 */
class CheckCancelledEvent extends types_1.DomainEvent {
    constructor(checkId) {
        super(checkId, 'CheckCancelled');
    }
}
exports.CheckCancelledEvent = CheckCancelledEvent;
/**
 * Fired when a check becomes overdue.
 */
class CheckOverdueEvent extends types_1.DomainEvent {
    amount;
    ownerName;
    dueDate;
    daysOverdue;
    constructor(checkId, amount, ownerName, dueDate, daysOverdue) {
        super(checkId, 'CheckOverdue');
        this.amount = amount;
        this.ownerName = ownerName;
        this.dueDate = dueDate;
        this.daysOverdue = daysOverdue;
    }
}
exports.CheckOverdueEvent = CheckOverdueEvent;
//# sourceMappingURL=payment.events.js.map