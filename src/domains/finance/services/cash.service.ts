import { Money } from '@shared/types';
import { Transaction } from '../entities/transaction.entity';
import { TransactionType, TransactionStatus, PaymentMethod } from '../entities/transaction.enums';

/**
 * CashService - Domain Service
 * Calculates cash-related metrics from transactions.
 */
export class CashService {
  /**
   * Calculate total cash balance from active transactions.
   */
  calculateBalance(transactions: Transaction[]): Money {
    let balance = Money.zero();

    for (const tx of transactions) {
      if (tx.status !== TransactionStatus.ACTIVE) continue;

      if (tx.type === TransactionType.INCOME) {
        balance = balance.add(tx.amount);
      } else {
        balance = balance.subtract(tx.amount);
      }
    }

    return balance;
  }

  /**
   * Calculate balance by payment method.
   */
  calculateBalanceByMethod(
    transactions: Transaction[],
    method: PaymentMethod
  ): Money {
    const filtered = transactions.filter(
      tx => tx.paymentMethod === method && tx.status === TransactionStatus.ACTIVE
    );
    return this.calculateBalance(filtered);
  }

  /**
   * Calculate total income for a date range.
   */
  calculateIncome(transactions: Transaction[]): Money {
    return transactions
      .filter(tx => tx.type === TransactionType.INCOME && tx.status === TransactionStatus.ACTIVE)
      .reduce((sum, tx) => sum.add(tx.amount), Money.zero());
  }

  /**
   * Calculate total expenses for a date range.
   */
  calculateExpenses(transactions: Transaction[]): Money {
    return transactions
      .filter(tx => tx.type === TransactionType.EXPENSE && tx.status === TransactionStatus.ACTIVE)
      .reduce((sum, tx) => sum.add(tx.amount), Money.zero());
  }

  /**
   * Calculate net profit (income - expenses).
   */
  calculateNet(transactions: Transaction[]): Money {
    const income = this.calculateIncome(transactions);
    const expenses = this.calculateExpenses(transactions);
    return income.subtract(expenses);
  }

  /**
   * Calculate VAT totals.
   */
  calculateTotalVat(transactions: Transaction[]): Money {
    return transactions
      .filter(tx => tx.status === TransactionStatus.ACTIVE)
      .reduce((sum, tx) => {
        if (tx.type === TransactionType.INCOME) {
          return sum.add(tx.vatAmount);
        }
        return sum.subtract(tx.vatAmount);
      }, Money.zero());
  }

  /**
   * Get daily summary for a set of transactions.
   */
  getDailySummary(transactions: Transaction[]): {
    totalIncome: Money;
    totalExpenses: Money;
    netBalance: Money;
    totalVat: Money;
    transactionCount: number;
    byMethod: Record<PaymentMethod, { income: Money; expense: Money }>;
  } {
    const methods = Object.values(PaymentMethod);
    const byMethod: Record<string, { income: Money; expense: Money }> = {};

    for (const method of methods) {
      const methodTxs = transactions.filter(
        tx => tx.paymentMethod === method && tx.status === TransactionStatus.ACTIVE
      );
      byMethod[method] = {
        income: this.calculateIncome(methodTxs),
        expense: this.calculateExpenses(methodTxs),
      };
    }

    const activeTxs = transactions.filter(tx => tx.status === TransactionStatus.ACTIVE);

    return {
      totalIncome: this.calculateIncome(activeTxs),
      totalExpenses: this.calculateExpenses(activeTxs),
      netBalance: this.calculateNet(activeTxs),
      totalVat: this.calculateTotalVat(activeTxs),
      transactionCount: activeTxs.length,
      byMethod: byMethod as Record<PaymentMethod, { income: Money; expense: Money }>,
    };
  }
}
