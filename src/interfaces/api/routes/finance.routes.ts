import { Request, Response, Router } from 'express';
import { CreateTransaction } from '@application/use-cases/finance/create-transaction.use-case';
import { TransactionType, PaymentMethod } from '@domains/finance';
import { CashService } from '@domains/finance';
import { ITransactionRepository } from '@domains/finance';

export function createFinanceRoutes(
  createTransaction: CreateTransaction,
  cashService: CashService,
  transactionRepo: ITransactionRepository
): Router {
  const router = Router();

  // POST /transactions - Create a new transaction
  router.post('/transactions', async (req: Request, res: Response) => {
    try {
      const { amount, vatAmount, type, paymentMethod, isInvoiced, description, createdBy, relatedProjectId } = req.body;

      const transaction = await createTransaction.execute({
        amount,
        vatAmount,
        type: type as TransactionType,
        paymentMethod: paymentMethod as PaymentMethod,
        isInvoiced,
        description,
        createdBy,
        relatedProjectId,
      });

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
        createdAt: t.createdAt,
      })));
    } catch (error: any) {
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
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
