/**
 * Base domain error class.
 */
export declare class DomainError extends Error {
    readonly code?: string | undefined;
    constructor(message: string, code?: string | undefined);
}
/**
 * Thrown when a business rule is violated.
 */
export declare class BusinessRuleViolationError extends DomainError {
    constructor(message: string);
}
/**
 * Thrown when an entity is not found.
 */
export declare class NotFoundError extends DomainError {
    constructor(entity: string, id: string);
}
/**
 * Thrown when a stock operation would result in negative stock.
 */
export declare class InsufficientStockError extends DomainError {
    constructor(materialName: string, requested: number, available: number);
}
/**
 * Thrown when an invalid state transition is attempted.
 */
export declare class InvalidStateTransitionError extends DomainError {
    constructor(entity: string, from: string, to: string);
}
//# sourceMappingURL=domain.errors.d.ts.map