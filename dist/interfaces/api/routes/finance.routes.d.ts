import { Router } from 'express';
import { CreateTransaction, UpdateTransaction, CancelTransaction } from '@application/use-cases/finance/create-transaction.use-case';
import { CashService } from '@domains/finance';
import { ITransactionRepository } from '@domains/finance';
export declare function createFinanceRoutes(createTransaction: CreateTransaction, updateTransaction: UpdateTransaction, cancelTransaction: CancelTransaction, cashService: CashService, transactionRepo: ITransactionRepository): Router;
//# sourceMappingURL=finance.routes.d.ts.map