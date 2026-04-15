import { Request, Response, Router } from 'express';
import { CreateTransaction } from '@application/use-cases/finance/create-transaction.use-case';
import { IRecurringTransactionRepository, RecurringFrequency, RecurringTransaction, PaymentMethod, TransactionType } from '@domains/finance';
import { logger } from '@shared/logger';

function mapPaymentMethod(value: string): PaymentMethod {
  if (value === PaymentMethod.CASH) return PaymentMethod.CASH;
  if (value === PaymentMethod.TRANSFER) return PaymentMethod.TRANSFER;
  if (value === PaymentMethod.CARD) return PaymentMethod.CARD;
  return PaymentMethod.TRANSFER;
}

export function createRecurringRoutes(
  recurringRepo: IRecurringTransactionRepository,
  createTransaction: CreateTransaction
): Router {
  const router = Router();

  router.get('/', async (_req: Request, res: Response) => {
    try {
      const items = await recurringRepo.findAll();
      res.json(items.map(item => ({
        id: item.id,
        description: item.description,
        amount: item.amount.amount,
        type: item.type,
        category: item.category,
        paymentMethod: item.paymentMethod,
        frequency: item.frequency,
        dayOfMonth: item.dayOfMonth,
        isActive: item.isActive,
        nextRun: item.nextRun,
        lastRun: item.lastRun,
        createdAt: item.createdAt,
      })));
    } catch (error: any) {
      logger.error('Failed to list recurring transactions', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/', async (req: Request, res: Response) => {
    try {
      const { description, amount, type, category, paymentMethod, frequency, dayOfMonth } = req.body;

      const item = RecurringTransaction.create({
        description,
        amount,
        type: type as TransactionType,
        category,
        paymentMethod,
        frequency: frequency as RecurringFrequency,
        dayOfMonth: Number(dayOfMonth),
      });

      await recurringRepo.save(item);

      logger.info('Recurring transaction created', { id: item.id, description: item.description, category: item.category });
      res.status(201).json({
        id: item.id,
        description: item.description,
        amount: item.amount.amount,
        type: item.type,
        category: item.category,
        paymentMethod: item.paymentMethod,
        frequency: item.frequency,
        dayOfMonth: item.dayOfMonth,
        isActive: item.isActive,
        nextRun: item.nextRun,
        lastRun: item.lastRun,
        createdAt: item.createdAt,
      });
    } catch (error: any) {
      logger.error('Failed to create recurring transaction', { error: error.message, body: req.body });
      res.status(400).json({ error: error.message });
    }
  });

  router.patch('/:id', async (req: Request, res: Response) => {
    try {
      const item = await recurringRepo.findById(req.params.id);
      if (!item) return res.status(404).json({ error: 'Recurring transaction not found' });

      item.setActive(Boolean(req.body.isActive));
      await recurringRepo.save(item);

      res.json({
        id: item.id,
        isActive: item.isActive,
      });
    } catch (error: any) {
      logger.error('Failed to update recurring transaction', { error: error.message, id: req.params.id });
      res.status(400).json({ error: error.message });
    }
  });

  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      await recurringRepo.delete(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      logger.error('Failed to delete recurring transaction', { error: error.message, id: req.params.id });
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/:id/run', async (req: Request, res: Response) => {
    try {
      const item = await recurringRepo.findById(req.params.id);
      if (!item) return res.status(404).json({ error: 'Recurring transaction not found' });
      if (!item.isActive) return res.status(400).json({ error: 'Recurring transaction is inactive' });

      const transaction = await createTransaction.execute({
        amount: item.amount.amount,
        vatAmount: 0,
        type: item.type,
        paymentMethod: mapPaymentMethod(item.paymentMethod),
        isInvoiced: false,
        description: `[Recurring:${item.category}] ${item.description}`,
        createdBy: req.user?.id ?? 'system',
      });

      item.markRun(new Date());
      await recurringRepo.save(item);

      logger.info('Recurring transaction executed', { recurringId: item.id, transactionId: transaction.id });
      res.status(201).json({
        recurringId: item.id,
        transactionId: transaction.id,
        nextRun: item.nextRun,
        lastRun: item.lastRun,
      });
    } catch (error: any) {
      logger.error('Failed to run recurring transaction', { error: error.message, id: req.params.id });
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}

