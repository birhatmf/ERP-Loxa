"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Check = void 0;
const types_1 = require("@shared/types");
const payment_enums_1 = require("./payment.enums");
const payment_events_1 = require("../events/payment.events");
/**
 * Check Aggregate Root.
 * Represents a check or deferred payment.
 *
 * RULE: When due date arrives, payment is expected.
 * When paid, a Transaction is created via domain event.
 */
class Check extends types_1.AggregateRoot {
    _type;
    _amount;
    _dueDate;
    _ownerName;
    _checkNumber;
    _bankName;
    _description;
    _status;
    _paidDate;
    _relatedProjectId;
    constructor(props) {
        super(props.id, props.createdAt, props.updatedAt);
        this._type = props.type;
        this._amount = props.amount;
        this._dueDate = props.dueDate;
        this._ownerName = props.ownerName;
        this._checkNumber = props.checkNumber;
        this._bankName = props.bankName;
        this._description = props.description;
        this._status = props.status;
        this._paidDate = props.paidDate;
        this._relatedProjectId = props.relatedProjectId;
    }
    static create(params) {
        if (params.amount.isZero() || params.amount.isNegative()) {
            throw new types_1.BusinessRuleViolationError('Check amount must be positive');
        }
        if (!params.ownerName || params.ownerName.trim().length === 0) {
            throw new types_1.BusinessRuleViolationError('Owner name is required');
        }
        if (params.dueDate < new Date()) {
            // Warning: creating a check with a past due date
            // This might be intentional (backdated entry), so just allow it
        }
        const now = new Date();
        const check = new Check({
            id: (0, types_1.generateId)(),
            ...params,
            description: params.description ?? '',
            status: payment_enums_1.CheckStatus.PENDING,
            createdAt: now,
            updatedAt: now,
        });
        check.addDomainEvent(new payment_events_1.CheckCreatedEvent(check.id, params.type, params.amount, params.dueDate));
        return check;
    }
    static reconstitute(props) {
        return new Check(props);
    }
    // --- Getters ---
    get type() { return this._type; }
    get amount() { return this._amount; }
    get dueDate() { return this._dueDate; }
    get ownerName() { return this._ownerName; }
    get checkNumber() { return this._checkNumber; }
    get bankName() { return this._bankName; }
    get description() { return this._description; }
    get status() { return this._status; }
    get paidDate() { return this._paidDate; }
    get relatedProjectId() { return this._relatedProjectId; }
    get isPending() { return this._status === payment_enums_1.CheckStatus.PENDING; }
    get isPaid() { return this._status === payment_enums_1.CheckStatus.PAID; }
    get isOverdue() {
        return this._status === payment_enums_1.CheckStatus.PENDING && new Date() > this._dueDate;
    }
    // --- Domain behavior ---
    /**
     * Mark check as paid.
     * This should trigger creation of a Transaction.
     */
    markAsPaid(paidDate) {
        if (this._status !== payment_enums_1.CheckStatus.PENDING) {
            throw new types_1.BusinessRuleViolationError(`Cannot mark check as paid: current status is ${this._status}`);
        }
        this._status = payment_enums_1.CheckStatus.PAID;
        this._paidDate = paidDate ?? new Date();
        this.touch();
        this.addDomainEvent(new payment_events_1.CheckPaidEvent(this.id, this._type, this._amount, this._paidDate));
    }
    /**
     * Mark check as bounced (karşılıksız).
     */
    markAsBounced() {
        if (this._status !== payment_enums_1.CheckStatus.PENDING) {
            throw new types_1.BusinessRuleViolationError(`Cannot mark check as bounced: current status is ${this._status}`);
        }
        this._status = payment_enums_1.CheckStatus.BOUNCED;
        this.touch();
        this.addDomainEvent(new payment_events_1.CheckBouncedEvent(this.id, this._amount, this._ownerName));
    }
    /**
     * Cancel the check.
     */
    cancel() {
        if (this._status !== payment_enums_1.CheckStatus.PENDING) {
            throw new types_1.BusinessRuleViolationError(`Cannot cancel check: current status is ${this._status}`);
        }
        this._status = payment_enums_1.CheckStatus.CANCELLED;
        this.touch();
        this.addDomainEvent(new payment_events_1.CheckCancelledEvent(this.id));
    }
}
exports.Check = Check;
//# sourceMappingURL=check.entity.js.map