"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFinanceRoutes = createFinanceRoutes;
const express_1 = require("express");
const logger_1 = require("@shared/logger");
function createFinanceRoutes(createTransaction, cashService, transactionRepo) {
    const router = (0, express_1.Router)();
    // POST /transactions - Create a new transaction
    router.post('/transactions', async (req, res) => {
        try {
            const { amount, vatAmount, type, paymentMethod, isInvoiced, description, createdBy, relatedProjectId } = req.body;
            const transaction = await createTransaction.execute({
                amount,
                vatAmount,
                type: type,
                paymentMethod: paymentMethod,
                isInvoiced,
                description,
                createdBy,
                relatedProjectId,
            });
            logger_1.logger.info('Transaction created', { id: transaction.id, type: transaction.type, amount: transaction.amount.amount });
            res.status(201).json({
                id: transaction.id,
                amount: transaction.amount.amount,
                vatAmount: transaction.vatAmount.amount,
                type: transaction.type,
                paymentMethod: transaction.paymentMethod,
                status: transaction.status,
                createdAt: transaction.createdAt,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to create transaction', { error: error.message, body: req.body });
            res.status(400).json({ error: error.message });
        }
    });
    // GET /transactions - List all transactions
    router.get('/transactions', async (req, res) => {
        try {
            const transactions = await transactionRepo.findAll();
            res.json(transactions.map(t => ({
                id: t.id,
                amount: t.amount.amount,
                vatAmount: t.vatAmount.amount,
                type: t.type,
                paymentMethod: t.paymentMethod,
                status: t.status,
                description: t.description,
                createdAt: t.createdAt,
            })));
        }
        catch (error) {
            logger_1.logger.error('Failed to list transactions', { error: error.message });
            res.status(500).json({ error: error.message });
        }
    });
    // GET /cash/balance - Get current cash balance
    router.get('/cash/balance', async (req, res) => {
        try {
            const transactions = await transactionRepo.findActive();
            const balance = cashService.calculateBalance(transactions);
            const summary = cashService.getDailySummary(transactions);
            res.json({
                balance: balance.amount,
                currency: balance.currency,
                totalIncome: summary.totalIncome.amount,
                totalExpenses: summary.totalExpenses.amount,
                netBalance: summary.netBalance.amount,
                transactionCount: summary.transactionCount,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get cash balance', { error: error.message });
            res.status(500).json({ error: error.message });
        }
    });
    return router;
}
//# sourceMappingURL=finance.routes.js.map