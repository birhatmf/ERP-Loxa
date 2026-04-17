import { Request, Response, Router } from 'express';
import { BudgetItem } from '@domains/budget/entities/budget-item.entity';
import { IBudgetRepository } from '@domains/budget/repositories/budget.repository';
import { logger } from '@shared/logger';

const VALID_TYPES = ['income', 'expense'];

export function createBudgetRoutes(
  budgetRepo: IBudgetRepository
): Router {
  const router = Router();

  // GET /budget - List all budget items
  router.get('/', async (_req: Request, res: Response) => {
    try {
      const items = await budgetRepo.findAll();
      res.json(items.map(item => ({
        id: item.id,
        category: item.category,
        type: item.type,
        planned: item.planned.amount,
        period: item.period,
        createdAt: item.createdAt,
      })));
    } catch (error: any) {
      logger.error('Failed to list budget items', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // GET /budget/:id - Get budget item details
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const item = await budgetRepo.findById(req.params.id);
      if (!item) {
        return res.status(404).json({ error: 'Budget item not found' });
      }
      res.json(item.toSafeObject());
    } catch (error: any) {
      logger.error('Failed to get budget item', { error: error.message, id: req.params.id });
      res.status(500).json({ error: error.message });
    }
  });

  // POST /budget - Create a new budget item
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { category, type, planned, period } = req.body;

      if (!category || String(category).trim().length === 0) {
        return res.status(400).json({ error: 'Category is required' });
      }

      const budgetType = String(type ?? 'expense');
      if (!VALID_TYPES.includes(budgetType)) {
        return res.status(400).json({ error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` });
      }

      const plannedAmount = parseFloat(planned);
      if (isNaN(plannedAmount) || plannedAmount < 0) {
        return res.status(400).json({ error: 'Planned amount must be a positive number' });
      }

      const item = BudgetItem.create({
        category: String(category).trim(),
        type: budgetType as any,
        planned: plannedAmount,
        period: period ? String(period) : undefined,
      });

      await budgetRepo.save(item);

      logger.info('Budget item created', { id: item.id, category: item.category, type: item.type });
      res.status(201).json(item.toSafeObject());
    } catch (error: any) {
      logger.error('Failed to create budget item', { error: error.message, body: req.body });
      res.status(400).json({ error: error.message });
    }
  });

  // PATCH /budget/:id - Update budget item
  router.patch('/:id', async (req: Request, res: Response) => {
    try {
      const item = await budgetRepo.findById(req.params.id);
      if (!item) {
        return res.status(404).json({ error: 'Budget item not found' });
      }

      const { category, type, planned, period } = req.body;

      if (type && !VALID_TYPES.includes(String(type))) {
        return res.status(400).json({ error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` });
      }

      if (planned !== undefined) {
        const plannedAmount = parseFloat(planned);
        if (isNaN(plannedAmount) || plannedAmount < 0) {
          return res.status(400).json({ error: 'Planned amount must be a positive number' });
        }
      }

      item.updateInfo({
        category: category !== undefined ? String(category).trim() : undefined,
        type: type !== undefined ? String(type) as any : undefined,
        planned: planned !== undefined ? parseFloat(planned) : undefined,
        period: period !== undefined ? String(period) : undefined,
      });

      await budgetRepo.save(item);

      logger.info('Budget item updated', { id: item.id, category: item.category });
      res.json(item.toSafeObject());
    } catch (error: any) {
      logger.error('Failed to update budget item', { error: error.message, id: req.params.id });
      res.status(400).json({ error: error.message });
    }
  });

  // DELETE /budget/:id - Delete budget item
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const item = await budgetRepo.findById(req.params.id);
      if (!item) {
        return res.status(404).json({ error: 'Budget item not found' });
      }

      await budgetRepo.delete(req.params.id);
      logger.info('Budget item deleted', { id: req.params.id });
      res.status(204).send();
    } catch (error: any) {
      logger.error('Failed to delete budget item', { error: error.message, id: req.params.id });
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
