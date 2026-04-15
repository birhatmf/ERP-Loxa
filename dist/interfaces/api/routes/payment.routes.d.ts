import { Router } from 'express';
import { CreateCheck, PayCheck } from '@application/use-cases/payment/payment.use-cases';
import { ICheckFileRepository, ICheckRepository } from '@domains/payment';
import { ITransactionRepository } from '@domains/finance';
import { EventBus } from '@shared/types';
export declare function createPaymentRoutes(createCheck: CreateCheck, payCheck: PayCheck, checkRepo: ICheckRepository, checkFileRepo: ICheckFileRepository, transactionRepo: ITransactionRepository, eventBus: EventBus): Router;
//# sourceMappingURL=payment.routes.d.ts.map