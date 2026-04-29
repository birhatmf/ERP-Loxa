import { Request, Response, Router } from 'express';
import { AuthService } from '@domains/auth/services/auth.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { logger } from '@shared/logger';

export function createAuthRoutes(authService: AuthService): Router {
  const router = Router();

  // POST /auth/register
  router.post('/register', async (req: Request, res: Response) => {
    try {
      const { username, password, name, role } = req.body;
      const hasUsers = await authService.hasUsers();

      if (hasUsers) {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(403).json({ error: 'Admin access required' });
        }

        const requester = await authService.verifyToken(authHeader.substring(7));
        if (!requester.isAdmin) {
          return res.status(403).json({ error: 'Admin access required' });
        }
      }

      const result = await authService.register({
        username,
        password,
        name,
        role: hasUsers ? role : 'admin',
      });

      logger.info('User registered', { username: result.user.username, userId: result.user.id, role: result.user.role });
      res.status(201).json(result);
    } catch (error: any) {
      logger.warn('Failed to register user', { error: error.message, username: req.body?.username });
      res.status(400).json({ error: error.message });
    }
  });

  // POST /auth/login
  router.post('/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      const result = await authService.login(username, password);

      logger.info('User logged in', { username: result.user.username, userId: result.user.id, role: result.user.role });
      res.json(result);
    } catch (error: any) {
      logger.warn('Failed login attempt', { error: error.message, username: req.body?.username });
      res.status(401).json({ error: error.message });
    }
  });

  // GET /auth/me - Get current user
  router.get('/me', authMiddleware(authService), async (req: Request, res: Response) => {
    try {
      logger.http('Current user requested', { userId: req.user?.id });
      res.json(req.user!.toSafeObject());
    } catch (error: any) {
      logger.error('Failed to read current user', { error: error.message, userId: req.user?.id });
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
