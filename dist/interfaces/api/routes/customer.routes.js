"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCustomerRoutes = createCustomerRoutes;
const express_1 = require("express");
const customer_entity_1 = require("../../../domains/customer/entities/customer.entity");
const logger_1 = require("../../../shared/logger");
function createCustomerRoutes(customerRepo) {
    const router = (0, express_1.Router)();
    // GET /customers - List all customers
    router.get('/', async (_req, res) => {
        try {
            const customers = await customerRepo.findAll();
            res.json(customers.map(c => ({
                id: c.id,
                name: c.name,
                phone: c.phone,
                email: c.email,
                address: c.address,
                taxId: c.taxId,
                notes: c.notes,
                totalPurchases: c.totalPurchases.amount,
                outstandingBalance: c.outstandingBalance.amount,
                createdAt: c.createdAt,
            })));
        }
        catch (error) {
            logger_1.logger.error('Failed to list customers', { error: error.message });
            res.status(500).json({ error: error.message });
        }
    });
    // GET /customers/:id - Get customer details
    router.get('/:id', async (req, res) => {
        try {
            const customer = await customerRepo.findById(req.params.id);
            if (!customer) {
                return res.status(404).json({ error: 'Customer not found' });
            }
            res.json(customer.toSafeObject());
        }
        catch (error) {
            logger_1.logger.error('Failed to get customer', { error: error.message, id: req.params.id });
            res.status(500).json({ error: error.message });
        }
    });
    // POST /customers - Create a new customer
    router.post('/', async (req, res) => {
        try {
            const { name, phone, email, address, taxId, notes } = req.body;
            if (!name || String(name).trim().length === 0) {
                return res.status(400).json({ error: 'Customer name is required' });
            }
            const customer = customer_entity_1.Customer.create({
                name: String(name).trim(),
                phone: phone ? String(phone) : '',
                email: email ? String(email) : '',
                address: address ? String(address) : '',
                taxId: taxId ? String(taxId) : '',
                notes: notes ? String(notes) : '',
            });
            await customerRepo.save(customer);
            logger_1.logger.info('Customer created', { id: customer.id, name: customer.name });
            res.status(201).json(customer.toSafeObject());
        }
        catch (error) {
            logger_1.logger.error('Failed to create customer', { error: error.message, body: req.body });
            res.status(400).json({ error: error.message });
        }
    });
    // PATCH /customers/:id - Update customer
    router.patch('/:id', async (req, res) => {
        try {
            const customer = await customerRepo.findById(req.params.id);
            if (!customer) {
                return res.status(404).json({ error: 'Customer not found' });
            }
            const { name, phone, email, address, taxId, notes } = req.body;
            customer.updateInfo({
                name: name !== undefined ? String(name).trim() : undefined,
                phone: phone !== undefined ? String(phone) : undefined,
                email: email !== undefined ? String(email) : undefined,
                address: address !== undefined ? String(address) : undefined,
                taxId: taxId !== undefined ? String(taxId) : undefined,
                notes: notes !== undefined ? String(notes) : undefined,
            });
            await customerRepo.save(customer);
            logger_1.logger.info('Customer updated', { id: customer.id, name: customer.name });
            res.json(customer.toSafeObject());
        }
        catch (error) {
            logger_1.logger.error('Failed to update customer', { error: error.message, id: req.params.id });
            res.status(400).json({ error: error.message });
        }
    });
    // DELETE /customers/:id - Delete customer
    router.delete('/:id', async (req, res) => {
        try {
            const customer = await customerRepo.findById(req.params.id);
            if (!customer) {
                return res.status(404).json({ error: 'Customer not found' });
            }
            await customerRepo.delete(req.params.id);
            logger_1.logger.info('Customer deleted', { id: req.params.id });
            res.status(204).send();
        }
        catch (error) {
            logger_1.logger.error('Failed to delete customer', { error: error.message, id: req.params.id });
            res.status(500).json({ error: error.message });
        }
    });
    return router;
}
//# sourceMappingURL=customer.routes.js.map