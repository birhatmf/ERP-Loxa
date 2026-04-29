"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRecurringRoutes = createRecurringRoutes;
const express_1 = require("express");
const finance_1 = require("../../../domains/finance");
const logger_1 = require("../../../shared/logger");
function mapPaymentMethod(value) {
    if (value === finance_1.PaymentMethod.CASH)
        return finance_1.PaymentMethod.CASH;
    if (value === finance_1.PaymentMethod.TRANSFER)
        return finance_1.PaymentMethod.TRANSFER;
    if (value === finance_1.PaymentMethod.CARD)
        return finance_1.PaymentMethod.CARD;
    return finance_1.PaymentMethod.TRANSFER;
}
function createRecurringRoutes(recurringRepo, createTransaction) {
    const router = (0, express_1.Router)();
    router.get('/', async (_req, res) => {
        try {
            const items = await recurringRepo.findAll();
            res.json(items.map(item => ({
                id: item.id,
                description: item.description,
                amount: item.amount.amount,
                type: item.type,
                category: item.category,
                paymentMethod: item.paymentMethod,
                frequency: item.frequency,
                dayOfMonth: item.dayOfMonth,
                isActive: item.isActive,
                nextRun: item.nextRun,
                lastRun: item.lastRun,
                createdAt: item.createdAt,
            })));
        }
        catch (error) {
            logger_1.logger.error('Failed to list recurring transactions', { error: error.message });
            res.status(500).json({ error: error.message });
        }
    });
    router.post('/', async (req, res) => {
        try {
            const { description, amount, type, category, paymentMethod, frequency, dayOfMonth } = req.body;
            const item = finance_1.RecurringTransaction.create({
                description,
                amount,
                type: type,
                category,
                paymentMethod,
                frequency: frequency,
                dayOfMonth: Number(dayOfMonth),
            });
            await recurringRepo.save(item);
            logger_1.logger.info('Recurring transaction created', { id: item.id, description: item.description, category: item.category });
            res.status(201).json({
                id: item.id,
                description: item.description,
                amount: item.amount.amount,
                type: item.type,
                category: item.category,
                paymentMethod: item.paymentMethod,
                frequency: item.frequency,
                dayOfMonth: item.dayOfMonth,
                isActive: item.isActive,
                nextRun: item.nextRun,
                lastRun: item.lastRun,
                createdAt: item.createdAt,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to create recurring transaction', { error: error.message, body: req.body });
            res.status(400).json({ error: error.message });
        }
    });
    router.patch('/:id', async (req, res) => {
        try {
            const item = await recurringRepo.findById(req.params.id);
            if (!item)
                return res.status(404).json({ error: 'Recurring transaction not found' });
            const hasEditableFields = ['description', 'amount', 'type', 'category', 'paymentMethod', 'frequency', 'dayOfMonth']
                .some((key) => req.body[key] !== undefined);
            if (hasEditableFields) {
                item.updateInfo({
                    description: req.body.description !== undefined ? String(req.body.description) : undefined,
                    amount: req.body.amount !== undefined ? Number(req.body.amount) : undefined,
                    type: req.body.type !== undefined ? req.body.type : undefined,
                    category: req.body.category !== undefined ? String(req.body.category) : undefined,
                    paymentMethod: req.body.paymentMethod !== undefined ? String(req.body.paymentMethod) : undefined,
                    frequency: req.body.frequency !== undefined ? req.body.frequency : undefined,
                    dayOfMonth: req.body.dayOfMonth !== undefined ? Number(req.body.dayOfMonth) : undefined,
                    isActive: req.body.isActive !== undefined ? Boolean(req.body.isActive) : undefined,
                });
            }
            else {
                item.setActive(Boolean(req.body.isActive));
            }
            await recurringRepo.save(item);
            res.json({
                id: item.id,
                description: item.description,
                amount: item.amount.amount,
                type: item.type,
                category: item.category,
                paymentMethod: item.paymentMethod,
                frequency: item.frequency,
                dayOfMonth: item.dayOfMonth,
                isActive: item.isActive,
                nextRun: item.nextRun,
                lastRun: item.lastRun,
                createdAt: item.createdAt,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to update recurring transaction', { error: error.message, id: req.params.id });
            res.status(400).json({ error: error.message });
        }
    });
    router.delete('/:id', async (req, res) => {
        try {
            await recurringRepo.delete(req.params.id);
            res.status(204).send();
        }
        catch (error) {
            logger_1.logger.error('Failed to delete recurring transaction', { error: error.message, id: req.params.id });
            res.status(500).json({ error: error.message });
        }
    });
    router.post('/:id/run', async (req, res) => {
        try {
            const item = await recurringRepo.findById(req.params.id);
            if (!item)
                return res.status(404).json({ error: 'Recurring transaction not found' });
            if (!item.isActive)
                return res.status(400).json({ error: 'Recurring transaction is inactive' });
            const transaction = await createTransaction.execute({
                amount: item.amount.amount,
                vatAmount: 0,
                type: item.type,
                paymentMethod: mapPaymentMethod(item.paymentMethod),
                isInvoiced: false,
                description: `[Recurring:${item.category}] ${item.description}`,
                createdBy: req.user?.id ?? 'system',
            });
            item.markRun(new Date());
            await recurringRepo.save(item);
            logger_1.logger.info('Recurring transaction executed', { recurringId: item.id, transactionId: transaction.id });
            res.status(201).json({
                recurringId: item.id,
                transactionId: transaction.id,
                nextRun: item.nextRun,
                lastRun: item.lastRun,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to run recurring transaction', { error: error.message, id: req.params.id });
            res.status(400).json({ error: error.message });
        }
    });
    return router;
}
//# sourceMappingURL=recurring.routes.js.map