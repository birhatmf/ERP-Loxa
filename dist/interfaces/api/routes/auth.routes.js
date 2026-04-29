"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthRoutes = createAuthRoutes;
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const logger_1 = require("../../../shared/logger");
function createAuthRoutes(authService) {
    const router = (0, express_1.Router)();
    // POST /auth/register
    router.post('/register', async (req, res) => {
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
            logger_1.logger.info('User registered', { username: result.user.username, userId: result.user.id, role: result.user.role });
            res.status(201).json(result);
        }
        catch (error) {
            logger_1.logger.warn('Failed to register user', { error: error.message, username: req.body?.username });
            res.status(400).json({ error: error.message });
        }
    });
    // POST /auth/login
    router.post('/login', async (req, res) => {
        try {
            const { username, password } = req.body;
            const result = await authService.login(username, password);
            logger_1.logger.info('User logged in', { username: result.user.username, userId: result.user.id, role: result.user.role });
            res.json(result);
        }
        catch (error) {
            logger_1.logger.warn('Failed login attempt', { error: error.message, username: req.body?.username });
            res.status(401).json({ error: error.message });
        }
    });
    // GET /auth/me - Get current user
    router.get('/me', (0, auth_middleware_1.authMiddleware)(authService), async (req, res) => {
        try {
            logger_1.logger.http('Current user requested', { userId: req.user?.id });
            res.json(req.user.toSafeObject());
        }
        catch (error) {
            logger_1.logger.error('Failed to read current user', { error: error.message, userId: req.user?.id });
            res.status(500).json({ error: error.message });
        }
    });
    return router;
}
//# sourceMappingURL=auth.routes.js.map