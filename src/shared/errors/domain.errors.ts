/**
 * Base domain error class.
 */
export class DomainError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'DomainError';
  }
}

/**
 * Thrown when a business rule is violated.
 */
export class BusinessRuleViolationError extends DomainError {
  constructor(message: string) {
    super(message, 'BUSINESS_RULE_VIOLATION');
    this.name = 'BusinessRuleViolationError';
  }
}

/**
 * Thrown when an entity is not found.
 */
export class NotFoundError extends DomainError {
  constructor(entity: string, id: string) {
    super(`${entity} with id '${id}' not found`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/**
 * Thrown when a stock operation would result in negative stock.
 */
export class InsufficientStockError extends DomainError {
  constructor(materialName: string, requested: number, available: number) {
    super(
      `Insufficient stock for '${materialName}': requested ${requested}, available ${available}`,
      'INSUFFICIENT_STOCK'
    );
    this.name = 'InsufficientStockError';
  }
}

/**
 * Thrown when an invalid state transition is attempted.
 */
export class InvalidStateTransitionError extends DomainError {
  constructor(entity: string, from: string, to: string) {
    super(
      `Invalid state transition for ${entity}: ${from} → ${to}`,
      'INVALID_STATE_TRANSITION'
    );
    this.name = 'InvalidStateTransitionError';
  }
}
