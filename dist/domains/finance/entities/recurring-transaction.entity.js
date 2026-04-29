"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecurringTransaction = void 0;
const types_1 = require("../../../shared/types");
const recurring_transaction_enums_1 = require("./recurring-transaction.enums");
class RecurringTransaction extends types_1.AggregateRoot {
    _description;
    _amount;
    _type;
    _category;
    _paymentMethod;
    _frequency;
    _dayOfMonth;
    _isActive;
    _nextRun;
    _lastRun;
    constructor(props) {
        super(props.id, props.createdAt, props.updatedAt);
        this._description = props.description;
        this._amount = props.amount;
        this._type = props.type;
        this._category = props.category;
        this._paymentMethod = props.paymentMethod;
        this._frequency = props.frequency;
        this._dayOfMonth = props.dayOfMonth;
        this._isActive = props.isActive;
        this._nextRun = props.nextRun;
        this._lastRun = props.lastRun;
    }
    static create(params) {
        if (!params.description || params.description.trim().length === 0) {
            throw new types_1.BusinessRuleViolationError('Recurring description is required');
        }
        if (!params.category || params.category.trim().length === 0) {
            throw new types_1.BusinessRuleViolationError('Recurring category is required');
        }
        if (params.amount <= 0) {
            throw new types_1.BusinessRuleViolationError('Recurring amount must be positive');
        }
        if (params.dayOfMonth < 1 || params.dayOfMonth > 28) {
            throw new types_1.BusinessRuleViolationError('dayOfMonth must be between 1 and 28');
        }
        const now = params.createdAt ?? new Date();
        const nextRun = RecurringTransaction.calculateNextRun(now, params.frequency, params.dayOfMonth);
        return new RecurringTransaction({
            id: (0, types_1.generateId)(),
            description: params.description.trim(),
            amount: types_1.Money.create(params.amount),
            type: params.type,
            category: params.category.trim(),
            paymentMethod: params.paymentMethod,
            frequency: params.frequency,
            dayOfMonth: params.dayOfMonth,
            isActive: true,
            nextRun,
            createdAt: now,
            updatedAt: now,
        });
    }
    static reconstitute(props) {
        return new RecurringTransaction(props);
    }
    get description() { return this._description; }
    get amount() { return this._amount; }
    get type() { return this._type; }
    get category() { return this._category; }
    get paymentMethod() { return this._paymentMethod; }
    get frequency() { return this._frequency; }
    get dayOfMonth() { return this._dayOfMonth; }
    get isActive() { return this._isActive; }
    get nextRun() { return this._nextRun; }
    get lastRun() { return this._lastRun; }
    setActive(isActive) {
        this._isActive = isActive;
        this.touch();
    }
    updateInfo(params) {
        if (params.description !== undefined) {
            if (!params.description.trim()) {
                throw new types_1.BusinessRuleViolationError('Recurring description is required');
            }
            this._description = params.description.trim();
        }
        if (params.amount !== undefined) {
            if (params.amount <= 0) {
                throw new types_1.BusinessRuleViolationError('Recurring amount must be positive');
            }
            this._amount = types_1.Money.create(params.amount);
        }
        if (params.type !== undefined) {
            this._type = params.type;
        }
        if (params.category !== undefined) {
            if (!params.category.trim()) {
                throw new types_1.BusinessRuleViolationError('Recurring category is required');
            }
            this._category = params.category.trim();
        }
        if (params.paymentMethod !== undefined) {
            this._paymentMethod = params.paymentMethod;
        }
        if (params.frequency !== undefined) {
            this._frequency = params.frequency;
        }
        if (params.dayOfMonth !== undefined) {
            if (params.dayOfMonth < 1 || params.dayOfMonth > 28) {
                throw new types_1.BusinessRuleViolationError('dayOfMonth must be between 1 and 28');
            }
            this._dayOfMonth = params.dayOfMonth;
        }
        if (params.frequency !== undefined ||
            params.dayOfMonth !== undefined) {
            this._nextRun = RecurringTransaction.calculateNextRun(new Date(), this._frequency, this._dayOfMonth);
        }
        if (params.isActive !== undefined) {
            this._isActive = params.isActive;
        }
        this.touch();
    }
    markRun(runDate = new Date()) {
        this._lastRun = runDate;
        this._nextRun = RecurringTransaction.calculateNextRun(runDate, this._frequency, this._dayOfMonth);
        this.touch();
    }
    static calculateNextRun(baseDate, frequency, dayOfMonth) {
        const next = new Date(baseDate);
        switch (frequency) {
            case recurring_transaction_enums_1.RecurringFrequency.DAILY:
                next.setDate(next.getDate() + 1);
                break;
            case recurring_transaction_enums_1.RecurringFrequency.WEEKLY:
                next.setDate(next.getDate() + 7);
                break;
            case recurring_transaction_enums_1.RecurringFrequency.MONTHLY:
                next.setMonth(next.getMonth() + 1);
                next.setDate(dayOfMonth);
                break;
            case recurring_transaction_enums_1.RecurringFrequency.QUARTERLY:
                next.setMonth(next.getMonth() + 3);
                next.setDate(dayOfMonth);
                break;
            case recurring_transaction_enums_1.RecurringFrequency.YEARLY:
                next.setFullYear(next.getFullYear() + 1);
                next.setDate(dayOfMonth);
                break;
            default:
                next.setMonth(next.getMonth() + 1);
                next.setDate(dayOfMonth);
        }
        return next;
    }
}
exports.RecurringTransaction = RecurringTransaction;
//# sourceMappingURL=recurring-transaction.entity.js.map