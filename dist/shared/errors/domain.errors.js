"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidStateTransitionError = exports.InsufficientStockError = exports.NotFoundError = exports.BusinessRuleViolationError = exports.DomainError = void 0;
/**
 * Base domain error class.
 */
class DomainError extends Error {
    code;
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = 'DomainError';
    }
}
exports.DomainError = DomainError;
/**
 * Thrown when a business rule is violated.
 */
class BusinessRuleViolationError extends DomainError {
    constructor(message) {
        super(message, 'BUSINESS_RULE_VIOLATION');
        this.name = 'BusinessRuleViolationError';
    }
}
exports.BusinessRuleViolationError = BusinessRuleViolationError;
/**
 * Thrown when an entity is not found.
 */
class NotFoundError extends DomainError {
    constructor(entity, id) {
        super(`${entity} with id '${id}' not found`, 'NOT_FOUND');
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
/**
 * Thrown when a stock operation would result in negative stock.
 */
class InsufficientStockError extends DomainError {
    constructor(materialName, requested, available) {
        super(`Insufficient stock for '${materialName}': requested ${requested}, available ${available}`, 'INSUFFICIENT_STOCK');
        this.name = 'InsufficientStockError';
    }
}
exports.InsufficientStockError = InsufficientStockError;
/**
 * Thrown when an invalid state transition is attempted.
 */
class InvalidStateTransitionError extends DomainError {
    constructor(entity, from, to) {
        super(`Invalid state transition for ${entity}: ${from} → ${to}`, 'INVALID_STATE_TRANSITION');
        this.name = 'InvalidStateTransitionError';
    }
}
exports.InvalidStateTransitionError = InvalidStateTransitionError;
//# sourceMappingURL=domain.errors.js.map