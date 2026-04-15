import { Request, Response, Router } from 'express';
import { INotificationRepository } from '@shared/notifications/notification.repository';
import { logger } from '@shared/logger';

export function createNotificationRoutes(notificationRepo: INotificationRepository): Router {
  const router = Router();

  router.get('/', async (_req: Request, res: Response) => {
    try {
      const notifications = await notificationRepo.findAll();
      res.json(notifications.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        entityId: n.entityId,
        entityType: n.entityType,
        read: n.read,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      })));
    } catch (error: any) {
      logger.error('Failed to list notifications', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  router.patch('/:id/read', async (req: Request, res: Response) => {
    try {
      await notificationRepo.markAsRead(req.params.id);
      res.json({ ok: true });
    } catch (error: any) {
      logger.error('Failed to mark notification as read', { error: error.message, id: req.params.id });
      res.status(400).json({ error: error.message });
    }
  });

  router.patch('/read-all', async (_req: Request, res: Response) => {
    try {
      await notificationRepo.markAllAsRead();
      res.json({ ok: true });
    } catch (error: any) {
      logger.error('Failed to mark notifications as read', { error: error.message });
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}

