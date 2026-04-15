"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashService = void 0;
const types_1 = require("@shared/types");
const transaction_enums_1 = require("../entities/transaction.enums");
/**
 * CashService - Domain Service
 * Calculates cash-related metrics from transactions.
 */
class CashService {
    /**
     * Calculate total cash balance from active transactions.
     */
    calculateBalance(transactions) {
        let balance = types_1.Money.zero();
        for (const tx of transactions) {
            if (tx.status !== transaction_enums_1.TransactionStatus.ACTIVE)
                continue;
            if (tx.type === transaction_enums_1.TransactionType.INCOME) {
                balance = balance.add(tx.amount);
            }
            else {
                balance = balance.subtract(tx.amount);
            }
        }
        return balance;
    }
    /**
     * Calculate balance by payment method.
     */
    calculateBalanceByMethod(transactions, method) {
        const filtered = transactions.filter(tx => tx.paymentMethod === method && tx.status === transaction_enums_1.TransactionStatus.ACTIVE);
        return this.calculateBalance(filtered);
    }
    /**
     * Calculate total income for a date range.
     */
    calculateIncome(transactions) {
        return transactions
            .filter(tx => tx.type === transaction_enums_1.TransactionType.INCOME && tx.status === transaction_enums_1.TransactionStatus.ACTIVE)
            .reduce((sum, tx) => sum.add(tx.amount), types_1.Money.zero());
    }
    /**
     * Calculate total expenses for a date range.
     */
    calculateExpenses(transactions) {
        return transactions
            .filter(tx => tx.type === transaction_enums_1.TransactionType.EXPENSE && tx.status === transaction_enums_1.TransactionStatus.ACTIVE)
            .reduce((sum, tx) => sum.add(tx.amount), types_1.Money.zero());
    }
    /**
     * Calculate net profit (income - expenses).
     */
    calculateNet(transactions) {
        const income = this.calculateIncome(transactions);
        const expenses = this.calculateExpenses(transactions);
        return income.subtract(expenses);
    }
    /**
     * Calculate VAT totals.
     */
    calculateTotalVat(transactions) {
        return transactions
            .filter(tx => tx.status === transaction_enums_1.TransactionStatus.ACTIVE)
            .reduce((sum, tx) => {
            if (tx.type === transaction_enums_1.TransactionType.INCOME) {
                return sum.add(tx.vatAmount);
            }
            return sum.subtract(tx.vatAmount);
        }, types_1.Money.zero());
    }
    /**
     * Get daily summary for a set of transactions.
     */
    getDailySummary(transactions) {
        const methods = Object.values(transaction_enums_1.PaymentMethod);
        const byMethod = {};
        for (const method of methods) {
            const methodTxs = transactions.filter(tx => tx.paymentMethod === method && tx.status === transaction_enums_1.TransactionStatus.ACTIVE);
            byMethod[method] = {
                income: this.calculateIncome(methodTxs),
                expense: this.calculateExpenses(methodTxs),
            };
        }
        const activeTxs = transactions.filter(tx => tx.status === transaction_enums_1.TransactionStatus.ACTIVE);
        return {
            totalIncome: this.calculateIncome(activeTxs),
            totalExpenses: this.calculateExpenses(activeTxs),
            netBalance: this.calculateNet(activeTxs),
            totalVat: this.calculateTotalVat(activeTxs),
            transactionCount: activeTxs.length,
            byMethod: byMethod,
        };
    }
}
exports.CashService = CashService;
//# sourceMappingURL=cash.service.js.map