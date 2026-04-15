import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@domains/auth/services/auth.service';
import { User } from '@domains/auth/entities/user.entity';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

/**
 * Auth middleware factory.
 * Validates JWT token and attaches user to request.
 */
export function authMiddleware(authService: AuthService) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization header required' });
      }

      const token = authHeader.substring(7);
      const user = await authService.verifyToken(token);
      req.user = user;
      next();
    } catch (error: any) {
      return res.status(401).json({ error: error.message });
    }
  };
}

/**
 * Admin-only middleware.
 * Must be used after authMiddleware.
 */
export function adminOnly(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
