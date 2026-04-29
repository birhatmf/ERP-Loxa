"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotificationRoutes = createNotificationRoutes;
const express_1 = require("express");
const logger_1 = require("../../../shared/logger");
function createNotificationRoutes(notificationRepo) {
    const router = (0, express_1.Router)();
    router.get('/', async (_req, res) => {
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
        }
        catch (error) {
            logger_1.logger.error('Failed to list notifications', { error: error.message });
            res.status(500).json({ error: error.message });
        }
    });
    router.patch('/:id/read', async (req, res) => {
        try {
            await notificationRepo.markAsRead(req.params.id);
            res.json({ ok: true });
        }
        catch (error) {
            logger_1.logger.error('Failed to mark notification as read', { error: error.message, id: req.params.id });
            res.status(400).json({ error: error.message });
        }
    });
    router.patch('/read-all', async (_req, res) => {
        try {
            await notificationRepo.markAllAsRead();
            res.json({ ok: true });
        }
        catch (error) {
            logger_1.logger.error('Failed to mark notifications as read', { error: error.message });
            res.status(400).json({ error: error.message });
        }
    });
    return router;
}
//# sourceMappingURL=notification.routes.js.map