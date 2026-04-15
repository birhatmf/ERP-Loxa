"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = void 0;
const types_1 = require("@shared/types");
const transaction_enums_1 = require("./transaction.enums");
const finance_events_1 = require("../events/finance.events");
/**
 * Transaction Aggregate Root.
 * Represents a financial movement in the system.
 *
 * RULE: Transactions can NEVER be deleted, only cancelled.
 */
class Transaction extends types_1.AggregateRoot {
    _amount;
    _vatAmount;
    _type;
    _paymentMethod;
    _isInvoiced;
    _description;
    _createdBy;
    _relatedProjectId;
    _status;
    _cancellationReason;
    constructor(props) {
        super(props.id, props.createdAt, props.updatedAt);
        this._amount = props.amount;
        this._vatAmount = props.vatAmount;
        this._type = props.type;
        this._paymentMethod = props.paymentMethod;
        this._isInvoiced = props.isInvoiced;
        this._description = props.description;
        this._createdBy = props.createdBy;
        this._relatedProjectId = props.relatedProjectId;
        this._status = props.status;
        this._cancellationReason = props.cancellationReason;
    }
    // --- Factory method for creating new transactions ---
    static create(params) {
        if (params.amount.isZero() || params.amount.isNegative()) {
            throw new types_1.BusinessRuleViolationError('Transaction amount must be positive');
        }
        const now = new Date();
        const transaction = new Transaction({
            id: (0, types_1.generateId)(),
            ...params,
            status: transaction_enums_1.TransactionStatus.ACTIVE,
            createdAt: now,
            updatedAt: now,
        });
        transaction.addDomainEvent(new finance_events_1.TransactionCreatedEvent(transaction.id, params.type, params.amount));
        return transaction;
    }
    // --- Factory method for reconstituting from persistence ---
    static reconstitute(props) {
        return new Transaction(props);
    }
    // --- Getters ---
    get amount() { return this._amount; }
    get vatAmount() { return this._vatAmount; }
    get totalWithVat() { return this._amount.add(this._vatAmount); }
    get type() { return this._type; }
    get paymentMethod() { return this._paymentMethod; }
    get isInvoiced() { return this._isInvoiced; }
    get description() { return this._description; }
    get createdBy() { return this._createdBy; }
    get relatedProjectId() { return this._relatedProjectId; }
    get status() { return this._status; }
    get cancellationReason() { return this._cancellationReason; }
    get isActive() { return this._status === transaction_enums_1.TransactionStatus.ACTIVE; }
    // --- Domain behavior ---
    /**
     * Cancel this transaction.
     * RULE: Active transactions can only be cancelled, never deleted.
     */
    cancel(reason) {
        if (this._status === transaction_enums_1.TransactionStatus.CANCELLED) {
            throw new types_1.BusinessRuleViolationError('Transaction is already cancelled');
        }
        this._status = transaction_enums_1.TransactionStatus.CANCELLED;
        this._cancellationReason = reason;
        this.touch();
        this.addDomainEvent(new finance_events_1.TransactionCancelledEvent(this.id, reason));
    }
    /**
     * Mark this transaction as invoiced.
     */
    markAsInvoiced() {
        if (this._isInvoiced) {
            throw new types_1.BusinessRuleViolationError('Transaction is already invoiced');
        }
        this._isInvoiced = true;
        this.touch();
    }
    /**
     * Link this transaction to a project.
     */
    linkToProject(projectId) {
        if (this._relatedProjectId) {
            throw new types_1.BusinessRuleViolationError('Transaction is already linked to a project');
        }
        this._relatedProjectId = projectId;
        this.touch();
    }
    /**
     * Update editable transaction details.
     * RULE: Amount must remain positive and cancelled transactions cannot be edited.
     */
    updateDetails(params) {
        if (this._status === transaction_enums_1.TransactionStatus.CANCELLED) {
            throw new types_1.BusinessRuleViolationError('Cancelled transactions cannot be edited');
        }
        if (params.amount !== undefined) {
            if (params.amount.isZero() || params.amount.isNegative()) {
                throw new types_1.BusinessRuleViolationError('Transaction amount must be positive');
            }
            this._amount = params.amount;
        }
        if (params.vatAmount !== undefined) {
            if (params.vatAmount.isNegative()) {
                throw new types_1.BusinessRuleViolationError('VAT amount cannot be negative');
            }
            this._vatAmount = params.vatAmount;
        }
        if (params.type !== undefined) {
            this._type = params.type;
        }
        if (params.paymentMethod !== undefined) {
            this._paymentMethod = params.paymentMethod;
        }
        if (params.isInvoiced !== undefined) {
            this._isInvoiced = params.isInvoiced;
        }
        if (params.description !== undefined) {
            this._description = params.description;
        }
        if (params.relatedProjectId !== undefined) {
            this._relatedProjectId = params.relatedProjectId ?? undefined;
        }
        this.touch();
    }
}
exports.Transaction = Transaction;
//# sourceMappingURL=transaction.entity.js.map