/**
 * Transaction type enum.
 */
export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

/**
 * Payment method enum.
 */
export enum PaymentMethod {
  CASH = 'nakit',
  TRANSFER = 'havale',
  CARD = 'kart',
}

/**
 * Transaction status enum.
 * Transactions can only be cancelled, never deleted.
 */
export enum TransactionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
}
