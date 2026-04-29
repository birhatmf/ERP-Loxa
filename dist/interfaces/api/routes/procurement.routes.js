"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProcurementRoutes = createProcurementRoutes;
const express_1 = require("express");
const logger_1 = require("../../../shared/logger");
const types_1 = require("../../../shared/types");
const sqlite_purchase_order_repository_1 = require("../../../infrastructure/database/repositories/sqlite-purchase-order.repository");
function normalizeOrderItems(items, materials) {
    return (items ?? []).map((item) => ({
        materialId: String(item.materialId ?? '').trim(),
        materialName: materials.get(String(item.materialId ?? '').trim()) ?? String(item.materialName ?? '').trim(),
        quantity: Number(item.quantity ?? 0),
        unitPrice: Number(item.unitPrice ?? 0),
        receivedQty: Number(item.receivedQty ?? 0),
    }));
}
async function buildMaterialNameMap(materialRepo) {
    const materials = await materialRepo.findAll();
    return new Map(materials.map(m => [m.id, m.name]));
}
function validateStatus(status) {
    return ['draft', 'sent', 'confirmed', 'received', 'cancelled'].includes(String(status));
}
function createProcurementRoutes(supplierRepo, orderRepo, materialRepo, stockService) {
    const router = (0, express_1.Router)();
    router.get('/suppliers', async (_req, res) => {
        try {
            const suppliers = await supplierRepo.findAll();
            res.json(suppliers.map(s => ({
                id: s.id,
                name: s.name,
                contactPerson: s.contactPerson,
                phone: s.phone,
                email: s.email,
                address: s.address,
                taxId: s.taxId,
                notes: s.notes,
                totalOrders: s.totalOrders ?? 0,
                createdAt: s.createdAt.toISOString(),
                updatedAt: s.updatedAt.toISOString(),
            })));
        }
        catch (error) {
            logger_1.logger.error('Failed to list suppliers', { error: error.message });
            res.status(500).json({ error: error.message });
        }
    });
    router.post('/suppliers', async (req, res) => {
        try {
            const { name, contactPerson, phone, email, address, taxId, notes } = req.body;
            if (!name || String(name).trim().length === 0) {
                return res.status(400).json({ error: 'Supplier name is required' });
            }
            const now = new Date();
            const supplier = {
                id: (0, types_1.generateId)(),
                name: String(name).trim(),
                contactPerson: String(contactPerson ?? ''),
                phone: String(phone ?? ''),
                email: String(email ?? ''),
                address: String(address ?? ''),
                taxId: String(taxId ?? ''),
                notes: String(notes ?? ''),
                createdAt: now,
                updatedAt: now,
            };
            await supplierRepo.save(supplier);
            logger_1.logger.info('Supplier created', { id: supplier.id, name: supplier.name });
            res.status(201).json({
                ...supplier,
                id: supplier.id,
                createdAt: supplier.createdAt.toISOString(),
                updatedAt: supplier.updatedAt.toISOString(),
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to create supplier', { error: error.message, body: req.body });
            res.status(400).json({ error: error.message });
        }
    });
    router.patch('/suppliers/:id', async (req, res) => {
        try {
            const current = await supplierRepo.findById(req.params.id);
            if (!current) {
                return res.status(404).json({ error: 'Supplier not found' });
            }
            const { name, contactPerson, phone, email, address, taxId, notes } = req.body;
            const nextName = name !== undefined ? String(name).trim() : current.name;
            if (!nextName) {
                return res.status(400).json({ error: 'Supplier name is required' });
            }
            const updated = {
                ...current,
                name: nextName,
                contactPerson: contactPerson !== undefined ? String(contactPerson ?? '') : current.contactPerson,
                phone: phone !== undefined ? String(phone ?? '') : current.phone,
                email: email !== undefined ? String(email ?? '') : current.email,
                address: address !== undefined ? String(address ?? '') : current.address,
                taxId: taxId !== undefined ? String(taxId ?? '') : current.taxId,
                notes: notes !== undefined ? String(notes ?? '') : current.notes,
                updatedAt: new Date(),
            };
            await supplierRepo.save(updated);
            await orderRepo.updateSupplierName(updated.id, updated.name);
            logger_1.logger.info('Supplier updated', { id: updated.id, name: updated.name });
            res.json({
                ...updated,
                createdAt: updated.createdAt.toISOString(),
                updatedAt: updated.updatedAt.toISOString(),
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to update supplier', { error: error.message, id: req.params.id, body: req.body });
            res.status(400).json({ error: error.message });
        }
    });
    router.delete('/suppliers/:id', async (req, res) => {
        try {
            const supplier = await supplierRepo.findById(req.params.id);
            if (!supplier) {
                return res.status(404).json({ error: 'Supplier not found' });
            }
            const orders = await orderRepo.findAll();
            const hasOrders = orders.some(order => order.supplierId === supplier.id);
            if (hasOrders) {
                return res.status(409).json({ error: 'Supplier has purchase orders and cannot be deleted' });
            }
            await supplierRepo.delete(req.params.id);
            logger_1.logger.info('Supplier deleted', { id: req.params.id });
            res.status(204).send();
        }
        catch (error) {
            logger_1.logger.error('Failed to delete supplier', { error: error.message, id: req.params.id });
            res.status(400).json({ error: error.message });
        }
    });
    router.get('/purchase-orders', async (_req, res) => {
        try {
            const orders = await orderRepo.findAll();
            res.json(orders.map(order => ({
                ...order,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
            })));
        }
        catch (error) {
            logger_1.logger.error('Failed to list purchase orders', { error: error.message });
            res.status(500).json({ error: error.message });
        }
    });
    router.post('/purchase-orders', async (req, res) => {
        try {
            const { supplierId, expectedDate, description, items } = req.body;
            if (!supplierId) {
                return res.status(400).json({ error: 'Supplier is required' });
            }
            const supplier = await supplierRepo.findById(String(supplierId));
            if (!supplier) {
                return res.status(404).json({ error: 'Supplier not found' });
            }
            const materialNames = await buildMaterialNameMap(materialRepo);
            const normalizedItems = normalizeOrderItems(Array.isArray(items) ? items : [], materialNames)
                .filter(item => item.materialId && item.quantity > 0);
            if (normalizedItems.length === 0) {
                return res.status(400).json({ error: 'At least one order item is required' });
            }
            const now = new Date().toISOString();
            const order = (0, sqlite_purchase_order_repository_1.buildPurchaseOrderRecord)({
                supplierId: supplier.id,
                supplierName: supplier.name,
                items: normalizedItems,
                expectedDate: expectedDate ? new Date(expectedDate).toISOString() : '',
                description: String(description ?? ''),
                createdAt: now,
                updatedAt: now,
            });
            await orderRepo.save(order);
            logger_1.logger.info('Purchase order created', { id: order.id, supplierId: order.supplierId });
            res.status(201).json(order);
        }
        catch (error) {
            logger_1.logger.error('Failed to create purchase order', { error: error.message, body: req.body });
            res.status(400).json({ error: error.message });
        }
    });
    router.patch('/purchase-orders/:id', async (req, res) => {
        try {
            const current = await orderRepo.findById(req.params.id);
            if (!current) {
                return res.status(404).json({ error: 'Purchase order not found' });
            }
            const { supplierId, expectedDate, description, items } = req.body;
            const nextSupplierId = supplierId ? String(supplierId) : current.supplierId;
            const supplier = await supplierRepo.findById(nextSupplierId);
            if (!supplier) {
                return res.status(404).json({ error: 'Supplier not found' });
            }
            const normalizedItems = Array.isArray(items)
                ? normalizeOrderItems(items, await buildMaterialNameMap(materialRepo)).filter(item => item.materialId && item.quantity > 0)
                : current.items;
            const updated = (0, sqlite_purchase_order_repository_1.buildPurchaseOrderRecord)({
                id: current.id,
                supplierId: supplier.id,
                supplierName: supplier.name,
                items: normalizedItems,
                status: current.status,
                expectedDate: expectedDate !== undefined ? (expectedDate ? new Date(expectedDate).toISOString() : '') : current.expectedDate,
                receivedDate: current.receivedDate,
                description: description !== undefined ? String(description ?? '') : current.description,
                createdAt: current.createdAt,
                updatedAt: new Date().toISOString(),
            });
            await orderRepo.save(updated);
            logger_1.logger.info('Purchase order updated', { id: updated.id, status: updated.status });
            res.json(updated);
        }
        catch (error) {
            logger_1.logger.error('Failed to update purchase order', { error: error.message, id: req.params.id, body: req.body });
            res.status(400).json({ error: error.message });
        }
    });
    router.patch('/purchase-orders/:id/status', async (req, res) => {
        try {
            const { status } = req.body;
            if (!validateStatus(status)) {
                return res.status(400).json({ error: 'Invalid status' });
            }
            const current = await orderRepo.findById(req.params.id);
            if (!current) {
                return res.status(404).json({ error: 'Purchase order not found' });
            }
            const shouldAddStock = status === 'received' && !current.stockPosted;
            if (shouldAddStock) {
                for (const item of current.items) {
                    await stockService.addStock({
                        materialId: item.materialId,
                        quantity: item.quantity,
                        description: `Purchase order ${current.id} received`,
                        date: new Date(),
                    });
                }
            }
            const updated = {
                ...current,
                status,
                receivedDate: status === 'received' && !current.receivedDate ? new Date().toISOString() : current.receivedDate,
                stockPosted: current.stockPosted || shouldAddStock,
                stockPostedAt: current.stockPostedAt || (shouldAddStock ? new Date().toISOString() : ''),
                updatedAt: new Date().toISOString(),
            };
            await orderRepo.save(updated);
            logger_1.logger.info('Purchase order status updated', { id: updated.id, status: updated.status });
            res.json(updated);
        }
        catch (error) {
            logger_1.logger.error('Failed to update purchase order status', { error: error.message, id: req.params.id, body: req.body });
            res.status(400).json({ error: error.message });
        }
    });
    router.delete('/purchase-orders/:id', async (req, res) => {
        try {
            const current = await orderRepo.findById(req.params.id);
            if (!current) {
                return res.status(404).json({ error: 'Purchase order not found' });
            }
            await orderRepo.delete(req.params.id);
            logger_1.logger.info('Purchase order deleted', { id: req.params.id });
            res.status(204).send();
        }
        catch (error) {
            logger_1.logger.error('Failed to delete purchase order', { error: error.message, id: req.params.id });
            res.status(400).json({ error: error.message });
        }
    });
    return router;
}
//# sourceMappingURL=procurement.routes.js.map