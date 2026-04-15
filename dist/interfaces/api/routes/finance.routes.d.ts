import { Router } from 'express';
import { CreateTransaction } from '@application/use-cases/finance/create-transaction.use-case';
import { CashService } from '@domains/finance';
import { ITransactionRepository } from '@domains/finance';
export declare function createFinanceRoutes(createTransaction: CreateTransaction, cashService: CashService, transactionRepo: ITransactionRepository): Router;
//# sourceMappingURL=finance.routes.d.ts.map