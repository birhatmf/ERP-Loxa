import { Request, Response, Router } from 'express';
import { CreateTransaction, UpdateTransaction, CancelTransaction } from '@application/use-cases/finance/create-transaction.use-case';
import { TransactionType, PaymentMethod } from '@domains/finance';
import { CashService } from '@domains/finance';
import { ITransactionRepository } from '@domains/finance';
import { logger } from '@shared/logger';

export function createFinanceRoutes(
  createTransaction: CreateTransaction,
  updateTransaction: UpdateTransaction,
  cancelTransaction: CancelTransaction,
  cashService: CashService,
  transactionRepo: ITransactionRepository
): Router {
  const router = Router();

  // POST /transactions - Create a new transaction
  router.post('/transactions', async (req: Request, res: Response) => {
    try {
      const { amount, vatAmount, type, paymentMethod, isInvoiced, description, createdBy, relatedProjectId, createdAt } = req.body;

      const transaction = await createTransaction.execute({
        amount,
        vatAmount,
        type: type as TransactionType,
        paymentMethod: paymentMethod as PaymentMethod,
        isInvoiced,
        description,
        createdBy,
        relatedProjectId,
        createdAt: createdAt ? new Date(createdAt) : undefined,
      });

      logger.info('Transaction created', { id: transaction.id, type: transaction.type, amount: transaction.amount.amount });
      res.status(201).json({
        id: transaction.id,
        amount: transaction.amount.amount,
        vatAmount: transaction.vatAmount.amount,
        type: transaction.type,
        paymentMethod: transaction.paymentMethod,
        status: transaction.status,
        createdAt: transaction.createdAt,
      });
    } catch (error: any) {
      logger.error('Failed to create transaction', { error: error.message, body: req.body });
      res.status(400).json({ error: error.message });
    }
  });

  // GET /transactions - List all transactions
  router.get('/transactions', async (req: Request, res: Response) => {
    try {
      const transactions = await transactionRepo.findAll();
      res.json(transactions.map(t => ({
        id: t.id,
        amount: t.amount.amount,
        vatAmount: t.vatAmount.amount,
        type: t.type,
        paymentMethod: t.paymentMethod,
        status: t.status,
        description: t.description,
        isInvoiced: t.isInvoiced,
        createdBy: t.createdBy,
        relatedProjectId: t.relatedProjectId,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })));
    } catch (error: any) {
      logger.error('Failed to list transactions', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // GET /cash/balance - Get current cash balance
  router.get('/cash/balance', async (req: Request, res: Response) => {
    try {
      const transactions = await transactionRepo.findActive();
      const balance = cashService.calculateBalance(transactions);
      const summary = cashService.getDailySummary(transactions);

      res.json({
        balance: balance.amount,
        currency: balance.currency,
        totalIncome: summary.totalIncome.amount,
        totalExpenses: summary.totalExpenses.amount,
        netBalance: summary.netBalance.amount,
        transactionCount: summary.transactionCount,
      });
    } catch (error: any) {
      logger.error('Failed to get cash balance', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  router.patch('/transactions/:id', async (req: Request, res: Response) => {
    try {
      const transaction = await updateTransaction.execute({
        transactionId: req.params.id,
        amount: req.body.amount !== undefined ? Number(req.body.amount) : undefined,
        vatAmount: req.body.vatAmount !== undefined ? Number(req.body.vatAmount) : undefined,
        type: req.body.type as TransactionType | undefined,
        paymentMethod: req.body.paymentMethod as PaymentMethod | undefined,
        isInvoiced: req.body.isInvoiced,
        description: req.body.description,
        createdBy: req.body.createdBy,
        relatedProjectId: req.body.relatedProjectId ?? undefined,
        createdAt: req.body.createdAt ? new Date(req.body.createdAt) : undefined,
      });

      res.json({
        id: transaction.id,
        amount: transaction.amount.amount,
        vatAmount: transaction.vatAmount.amount,
        type: transaction.type,
        paymentMethod: transaction.paymentMethod,
        status: transaction.status,
        description: transaction.description,
        isInvoiced: transaction.isInvoiced,
        createdBy: transaction.createdBy,
        relatedProjectId: transaction.relatedProjectId,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      });
    } catch (error: any) {
      logger.error('Failed to update transaction', { error: error.message, id: req.params.id, body: req.body });
      res.status(400).json({ error: error.message });
    }
  });

  router.delete('/transactions/:id', async (req: Request, res: Response) => {
    try {
      const transaction = await cancelTransaction.execute({
        transactionId: req.params.id,
        reason: req.body?.reason || 'Deleted from UI',
      });

      res.json({
        id: transaction.id,
        status: transaction.status,
        cancellationReason: transaction.cancellationReason,
      });
    } catch (error: any) {
      logger.error('Failed to cancel transaction', { error: error.message, id: req.params.id });
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}
