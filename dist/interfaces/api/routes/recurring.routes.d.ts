import { Router } from 'express';
import { CreateTransaction } from '@application/use-cases/finance/create-transaction.use-case';
import { IRecurringTransactionRepository } from '@domains/finance';
export declare function createRecurringRoutes(recurringRepo: IRecurringTransactionRepository, createTransaction: CreateTransaction): Router;
//# sourceMappingURL=recurring.routes.d.ts.map