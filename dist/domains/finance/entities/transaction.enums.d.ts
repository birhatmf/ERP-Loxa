/**
 * Transaction type enum.
 */
export declare enum TransactionType {
    INCOME = "income",
    EXPENSE = "expense"
}
/**
 * Payment method enum.
 */
export declare enum PaymentMethod {
    CASH = "nakit",
    TRANSFER = "havale",
    CARD = "kart"
}
/**
 * Transaction status enum.
 * Transactions can only be cancelled, never deleted.
 */
export declare enum TransactionStatus {
    ACTIVE = "active",
    CANCELLED = "cancelled"
}
//# sourceMappingURL=transaction.enums.d.ts.map