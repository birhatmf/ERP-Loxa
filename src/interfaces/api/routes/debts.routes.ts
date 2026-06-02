import { Request, Response, Router } from 'express';
import { generateId } from '@shared/types';
import { logger } from '@shared/logger';
import { Knex } from 'knex';

export function createDebtsRoutes(knex: Knex): Router {
  const router = Router();

  // GET /api/debts
  router.get('/', async (_req: Request, res: Response) => {
    try {
      const debts = await knex('debts').orderBy('due_date', 'asc');
      res.json(debts.map((d: any) => ({
        id: d.id,
        title: d.title,
        description: d.description,
        amount: Number(d.amount),
        currency: d.currency,
        dueDate: d.due_date,
        status: d.status,
        creditor: d.creditor,
        createdAt: d.created_at,
        updatedAt: d.updated_at
      })));
    } catch (error: any) {
      logger.error('Failed to list debts', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/debts
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { title, description, amount, dueDate, creditor } = req.body;
      const newDebt = {
        id: generateId(),
        title: String(title).trim(),
        description: description ? String(description).trim() : null,
        amount: Number(amount),
        due_date: new Date(dueDate).toISOString(),
        creditor: String(creditor).trim(),
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await knex('debts').insert(newDebt);
      res.status(201).json({
        id: newDebt.id,
        title: newDebt.title,
        description: newDebt.description,
        amount: newDebt.amount,
        dueDate: newDebt.due_date,
        creditor: newDebt.creditor,
        status: newDebt.status,
        createdAt: newDebt.created_at,
        updatedAt: newDebt.updated_at
      });
    } catch (error: any) {
      logger.error('Failed to create debt', { error: error.message });
      res.status(400).json({ error: error.message });
    }
  });

  // PATCH /api/debts/:id/status
  router.patch('/:id/status', async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      await knex('debts').where({ id: req.params.id }).update({
        status,
        updated_at: new Date().toISOString()
      });
      res.json({ success: true });
    } catch (error: any) {
      logger.error('Failed to update debt status', { error: error.message });
      res.status(400).json({ error: error.message });
    }
  });

  // DELETE /api/debts/:id
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      await knex('debts').where({ id: req.params.id }).delete();
      res.status(204).send();
    } catch (error: any) {
      logger.error('Failed to delete debt', { error: error.message });
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}
