"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionStatus = exports.PaymentMethod = exports.TransactionType = void 0;
/**
 * Transaction type enum.
 */
var TransactionType;
(function (TransactionType) {
    TransactionType["INCOME"] = "income";
    TransactionType["EXPENSE"] = "expense";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
/**
 * Payment method enum.
 */
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CASH"] = "nakit";
    PaymentMethod["TRANSFER"] = "havale";
    PaymentMethod["CARD"] = "kart";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
/**
 * Transaction status enum.
 * Transactions can only be cancelled, never deleted.
 */
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["ACTIVE"] = "active";
    TransactionStatus["CANCELLED"] = "cancelled";
})(TransactionStatus || (exports.TransactionStatus = TransactionStatus = {}));
//# sourceMappingURL=transaction.enums.js.map