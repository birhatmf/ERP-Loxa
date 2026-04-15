import { Money } from '@shared/types';
import { Transaction } from '../entities/transaction.entity';
import { PaymentMethod } from '../entities/transaction.enums';
/**
 * CashService - Domain Service
 * Calculates cash-related metrics from transactions.
 */
export declare class CashService {
    /**
     * Calculate total cash balance from active transactions.
     */
    calculateBalance(transactions: Transaction[]): Money;
    /**
     * Calculate balance by payment method.
     */
    calculateBalanceByMethod(transactions: Transaction[], method: PaymentMethod): Money;
    /**
     * Calculate total income for a date range.
     */
    calculateIncome(transactions: Transaction[]): Money;
    /**
     * Calculate total expenses for a date range.
     */
    calculateExpenses(transactions: Transaction[]): Money;
    /**
     * Calculate net profit (income - expenses).
     */
    calculateNet(transactions: Transaction[]): Money;
    /**
     * Calculate VAT totals.
     */
    calculateTotalVat(transactions: Transaction[]): Money;
    /**
     * Get daily summary for a set of transactions.
     */
    getDailySummary(transactions: Transaction[]): {
        totalIncome: Money;
        totalExpenses: Money;
        netBalance: Money;
        totalVat: Money;
        transactionCount: number;
        byMethod: Record<PaymentMethod, {
            income: Money;
            expense: Money;
        }>;
    };
}
//# sourceMappingURL=cash.service.d.ts.map