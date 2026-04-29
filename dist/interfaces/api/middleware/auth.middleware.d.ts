import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../../domains/auth/services/auth.service';
import { User } from '../../../domains/auth/entities/user.entity';
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
export declare function authMiddleware(authService: AuthService): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Admin-only middleware.
 * Must be used after authMiddleware.
 */
export declare function adminOnly(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=auth.middleware.d.ts.map