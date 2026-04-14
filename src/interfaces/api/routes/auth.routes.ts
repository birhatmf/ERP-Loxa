import { Request, Response, Router } from 'express';
import { AuthService } from '@domains/auth/services/auth.service';
import { authMiddleware } from '../middleware/auth.middleware';

export function createAuthRoutes(authService: AuthService): Router {
  const router = Router();

  // POST /auth/register
  router.post('/register', async (req: Request, res: Response) => {
    try {
      const { username, password, name, role } = req.body;

      const result = await authService.register({ username, password, name, role });

      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // POST /auth/login
  router.post('/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      const result = await authService.login(username, password);

      res.json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  });

  // GET /auth/me - Get current user
  router.get('/me', authMiddleware(authService), async (req: Request, res: Response) => {
    try {
      res.json(req.user!.toSafeObject());
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
