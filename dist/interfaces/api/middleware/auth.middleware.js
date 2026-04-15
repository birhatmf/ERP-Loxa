"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.adminOnly = adminOnly;
/**
 * Auth middleware factory.
 * Validates JWT token and attaches user to request.
 */
function authMiddleware(authService) {
    return async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'Authorization header required' });
            }
            const token = authHeader.substring(7);
            const user = await authService.verifyToken(token);
            req.user = user;
            next();
        }
        catch (error) {
            return res.status(401).json({ error: error.message });
        }
    };
}
/**
 * Admin-only middleware.
 * Must be used after authMiddleware.
 */
function adminOnly(req, res, next) {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}
//# sourceMappingURL=auth.middleware.js.map