import { Request, Response, Router } from 'express';
import { generateId } from '@shared/types';
import { logger } from '@shared/logger';
import { Knex } from 'knex';

export function createReceivablesRoutes(knex: Knex): Router {
  const router = Router();

  // GET /api/receivables
  router.get('/', async (_req: Request, res: Response) => {
    try {
      const receivables = await knex('receivables').orderBy('due_date', 'asc');
      res.json(receivables.map((d: any) => ({
        id: d.id,
        title: d.title,
        description: d.description,
        amount: Number(d.amount),
        currency: d.currency,
        dueDate: d.due_date,
        status: d.status,
        debtor: d.debtor,
        createdAt: d.created_at,
        updatedAt: d.updated_at
      })));
    } catch (error: any) {
      logger.error('Failed to list receivables', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/receivables
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { title, description, amount, dueDate, debtor } = req.body;
      const newRec = {
        id: generateId(),
        title: String(title).trim(),
        description: description ? String(description).trim() : null,
        amount: Number(amount),
        due_date: new Date(dueDate).toISOString(),
        debtor: String(debtor).trim(),
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await knex('receivables').insert(newRec);
      res.status(201).json({
        id: newRec.id,
        title: newRec.title,
        description: newRec.description,
        amount: newRec.amount,
        dueDate: newRec.due_date,
        debtor: newRec.debtor,
        status: newRec.status,
        createdAt: newRec.created_at,
        updatedAt: newRec.updated_at
      });
    } catch (error: any) {
      logger.error('Failed to create receivable', { error: error.message });
      res.status(400).json({ error: error.message });
    }
  });

  // PATCH /api/receivables/:id/status
  router.patch('/:id/status', async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      await knex('receivables').where({ id: req.params.id }).update({
        status,
        updated_at: new Date().toISOString()
      });
      res.json({ success: true });
    } catch (error: any) {
      logger.error('Failed to update receivable status', { error: error.message });
      res.status(400).json({ error: error.message });
    }
  });

  // DELETE /api/receivables/:id
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      await knex('receivables').where({ id: req.params.id }).delete();
      res.status(204).send();
    } catch (error: any) {
      logger.error('Failed to delete receivable', { error: error.message });
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}
