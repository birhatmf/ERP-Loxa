"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSalesRoutes = createSalesRoutes;
const express_1 = require("express");
const sale_entity_1 = require("../../../domains/sale/entities/sale.entity");
const project_1 = require("../../../domains/project");
const finance_1 = require("../../../domains/finance");
const logger_1 = require("../../../shared/logger");
const types_1 = require("../../../shared/types");
const VALID_STATUSES = ['bekliyor', 'kısmi', 'ödendi'];
const SALE_PAYMENT_PREFIX = 'Satış tahsilatı';
function toPaymentMethod(method) {
    if (method === finance_1.PaymentMethod.CASH || method === finance_1.PaymentMethod.CARD || method === finance_1.PaymentMethod.TRANSFER) {
        return method;
    }
    return finance_1.PaymentMethod.TRANSFER;
}
function buildSaleProjectDescription(saleId, description) {
    return `Kaynak satış: ${saleId}${description ? `\n${description}` : ''}`;
}
function createSalesRoutes(saleRepo, transactionRepo, projectRepo) {
    const router = (0, express_1.Router)();
    async function findProjectForSale(saleId) {
        const projects = await projectRepo.findAll();
        return projects.find(project => project.description.includes(`Kaynak satış: ${saleId}`)) ?? null;
    }
    async function ensureProjectForSale(sale) {
        const existing = await findProjectForSale(sale.id);
        if (existing)
            return existing;
        const projectName = sale.description.trim()
            || sale.items.map(item => item.description).filter(Boolean).join(', ')
            || `Satış #${sale.id.slice(-8).toUpperCase()}`;
        const project = project_1.Project.create({
            name: projectName,
            customerName: sale.customerName,
            description: buildSaleProjectDescription(sale.id, sale.description),
            startDate: sale.createdAt,
            totalPrice: sale.totalAmount,
        });
        await projectRepo.save(project);
        project.clearEvents();
        return project;
    }
    async function getSalePaymentTotal(saleId) {
        const transactions = await transactionRepo.findAll();
        return transactions
            .filter(transaction => transaction.status !== finance_1.TransactionStatus.CANCELLED &&
            transaction.type === finance_1.TransactionType.INCOME &&
            transaction.description.includes(`${SALE_PAYMENT_PREFIX} (${saleId})`))
            .reduce((sum, transaction) => sum + transaction.amount.amount, 0);
    }
    async function createSalePayment(params) {
        if (!Number.isFinite(params.amount) || params.amount <= 0)
            return;
        const alreadyPaid = await getSalePaymentTotal(params.sale.id);
        const remaining = Math.max(params.sale.totalAmount.amount - alreadyPaid, 0);
        const amount = Math.min(params.amount, remaining);
        if (amount <= 0)
            return;
        const project = await ensureProjectForSale(params.sale);
        const transaction = finance_1.Transaction.create({
            amount: types_1.Money.create(amount),
            vatAmount: types_1.Money.zero(),
            type: finance_1.TransactionType.INCOME,
            paymentMethod: toPaymentMethod(params.paymentMethod),
            isInvoiced: false,
            description: `${SALE_PAYMENT_PREFIX} (${params.sale.id}) - ${params.sale.customerName}${params.note ? ` - ${params.note}` : ''}`,
            createdBy: params.createdBy || 'system',
            relatedProjectId: project.id,
        });
        await transactionRepo.save(transaction);
    }
    async function toSaleResponse(sale) {
        const paidAmount = await getSalePaymentTotal(sale.id);
        const remainingAmount = Math.max(sale.totalAmount.amount - paidAmount, 0);
        const paymentStatus = paidAmount <= 0
            ? 'bekliyor'
            : remainingAmount <= 0.005
                ? 'ödendi'
                : 'kısmi';
        if (paymentStatus !== sale.paymentStatus) {
            sale.updatePayment({ paymentStatus: paymentStatus });
            await saleRepo.save(sale);
        }
        return {
            ...sale.toSafeObject(),
            paymentStatus,
            paidAmount,
            remainingAmount,
        };
    }
    // GET /sales - List all sales
    router.get('/', async (_req, res) => {
        try {
            const sales = await saleRepo.findAll();
            res.json(await Promise.all(sales.map(s => toSaleResponse(s))));
        }
        catch (error) {
            logger_1.logger.error('Failed to list sales', { error: error.message });
            res.status(500).json({ error: error.message });
        }
    });
    // GET /sales/:id - Get sale details
    router.get('/:id', async (req, res) => {
        try {
            const sale = await saleRepo.findById(req.params.id);
            if (!sale) {
                return res.status(404).json({ error: 'Sale not found' });
            }
            res.json(sale.toSafeObject());
        }
        catch (error) {
            logger_1.logger.error('Failed to get sale', { error: error.message, id: req.params.id });
            res.status(500).json({ error: error.message });
        }
    });
    // POST /sales - Create a new sale
    router.post('/', async (req, res) => {
        try {
            const { customerName, customerPhone, customerAddress, items, paymentMethod, paymentStatus, paymentNote, description, paidAmount } = req.body;
            if (!customerName || String(customerName).trim().length === 0) {
                return res.status(400).json({ error: 'Customer name is required' });
            }
            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ error: 'At least one item is required' });
            }
            const sale = sale_entity_1.Sale.create({
                customerName: String(customerName).trim(),
                customerPhone: customerPhone ? String(customerPhone) : '',
                customerAddress: customerAddress ? String(customerAddress) : '',
                items: items.map((item) => ({
                    description: String(item.description),
                    quantity: parseFloat(item.quantity) || 0,
                    unitPrice: parseFloat(item.unitPrice) || 0,
                })),
                paymentMethod: paymentMethod ? String(paymentMethod) : 'nakit',
                paymentStatus: VALID_STATUSES.includes(paymentStatus) ? paymentStatus : 'bekliyor',
                paymentNote: paymentNote ? String(paymentNote) : '',
                description: description ? String(description) : '',
            });
            await saleRepo.save(sale);
            await ensureProjectForSale(sale);
            const totalAmount = sale.totalAmount.amount;
            const requestedPayment = Number(paidAmount ?? 0);
            const initialPaymentAmount = paymentStatus === 'ödendi'
                ? totalAmount
                : paymentStatus === 'kısmi'
                    ? requestedPayment
                    : requestedPayment > 0
                        ? requestedPayment
                        : 0;
            await createSalePayment({
                sale,
                amount: initialPaymentAmount,
                paymentMethod: sale.paymentMethod,
                note: sale.paymentNote,
                createdBy: req.user?.id,
            });
            logger_1.logger.info('Sale created', { id: sale.id, customerName: sale.customerName, total: sale.totalAmount.amount });
            res.status(201).json(await toSaleResponse(sale));
        }
        catch (error) {
            logger_1.logger.error('Failed to create sale', { error: error.message, body: req.body });
            res.status(400).json({ error: error.message });
        }
    });
    // PATCH /sales/:id - Update sale
    router.patch('/:id', async (req, res) => {
        try {
            const sale = await saleRepo.findById(req.params.id);
            if (!sale) {
                return res.status(404).json({ error: 'Sale not found' });
            }
            const { paymentStatus, paymentMethod, paymentNote, description, paidAmount } = req.body;
            if (paymentStatus && !VALID_STATUSES.includes(paymentStatus)) {
                return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
            }
            sale.updatePayment({
                paymentStatus: paymentStatus,
                paymentMethod: paymentMethod ? String(paymentMethod) : undefined,
                paymentNote: paymentNote !== undefined ? String(paymentNote) : undefined,
            });
            if (description !== undefined) {
                sale.updateInfo({
                    description: String(description),
                });
            }
            await saleRepo.save(sale);
            await ensureProjectForSale(sale);
            const paymentAmount = Number(paidAmount ?? 0);
            const alreadyPaid = await getSalePaymentTotal(sale.id);
            const remaining = Math.max(sale.totalAmount.amount - alreadyPaid, 0);
            const nextPaymentAmount = paymentAmount > 0
                ? paymentAmount
                : paymentStatus === 'ödendi' && remaining > 0
                    ? remaining
                    : 0;
            await createSalePayment({
                sale,
                amount: nextPaymentAmount,
                paymentMethod: sale.paymentMethod,
                note: sale.paymentNote,
                createdBy: req.user?.id,
            });
            logger_1.logger.info('Sale updated', { id: sale.id });
            res.json(await toSaleResponse(sale));
        }
        catch (error) {
            logger_1.logger.error('Failed to update sale', { error: error.message, id: req.params.id });
            res.status(400).json({ error: error.message });
        }
    });
    // DELETE /sales/:id - Delete sale
    router.delete('/:id', async (req, res) => {
        try {
            const sale = await saleRepo.findById(req.params.id);
            if (!sale) {
                return res.status(404).json({ error: 'Sale not found' });
            }
            await saleRepo.delete(req.params.id);
            logger_1.logger.info('Sale deleted', { id: req.params.id });
            res.status(204).send();
        }
        catch (error) {
            logger_1.logger.error('Failed to delete sale', { error: error.message, id: req.params.id });
            res.status(500).json({ error: error.message });
        }
    });
    return router;
}
//# sourceMappingURL=sales.routes.js.map