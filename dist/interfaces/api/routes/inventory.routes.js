"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInventoryRoutes = createInventoryRoutes;
const express_1 = require("express");
const logger_1 = require("@shared/logger");
function createInventoryRoutes(createMaterial, addStock, stockService, materialRepo) {
    const router = (0, express_1.Router)();
    // POST /materials - Create a new material
    router.post('/materials', async (req, res) => {
        try {
            const { name, unit, minStockLevel } = req.body;
            const material = await createMaterial.execute({
                name,
                unit: unit,
                minStockLevel,
            });
            logger_1.logger.info('Material created', { id: material.id, name: material.name });
            res.status(201).json({
                id: material.id,
                name: material.name,
                unit: material.unit,
                currentStock: material.currentStock,
                minStockLevel: material.minStockLevel,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to create material', { error: error.message, body: req.body });
            res.status(400).json({ error: error.message });
        }
    });
    // GET /materials - List all materials
    router.get('/materials', async (req, res) => {
        try {
            const materials = await materialRepo.findAll();
            res.json(materials.map(m => ({
                id: m.id,
                name: m.name,
                unit: m.unit,
                currentStock: m.currentStock,
                minStockLevel: m.minStockLevel,
                isLowStock: m.isLowStock,
            })));
        }
        catch (error) {
            logger_1.logger.error('Failed to list materials', { error: error.message });
            res.status(500).json({ error: error.message });
        }
    });
    // GET /materials/low-stock - Get low stock materials
    router.get('/materials/low-stock', async (req, res) => {
        try {
            const lowStock = await stockService.getLowStockMaterials();
            res.json(lowStock.map(m => ({
                id: m.id,
                name: m.name,
                unit: m.unit,
                currentStock: m.currentStock,
                minStockLevel: m.minStockLevel,
            })));
        }
        catch (error) {
            logger_1.logger.error('Failed to get low stock materials', { error: error.message });
            res.status(500).json({ error: error.message });
        }
    });
    // POST /materials/:id/stock - Add stock
    router.post('/materials/:id/stock', async (req, res) => {
        try {
            const { quantity, description } = req.body;
            await addStock.execute({
                materialId: req.params.id,
                quantity,
                description,
            });
            const material = await materialRepo.findById(req.params.id);
            logger_1.logger.info('Stock added', { materialId: req.params.id, quantity });
            res.json({
                id: material.id,
                name: material.name,
                currentStock: material.currentStock,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to add stock', { error: error.message, materialId: req.params.id, body: req.body });
            res.status(400).json({ error: error.message });
        }
    });
    // GET /materials/:id/history - Get stock history
    router.get('/materials/:id/history', async (req, res) => {
        try {
            const movements = await stockService.getStockHistory(req.params.id);
            res.json(movements.map(m => ({
                id: m.id,
                type: m.type,
                quantity: m.quantity,
                description: m.description,
                date: m.date,
            })));
        }
        catch (error) {
            logger_1.logger.error('Failed to get stock history', { error: error.message, materialId: req.params.id });
            res.status(500).json({ error: error.message });
        }
    });
    return router;
}
//# sourceMappingURL=inventory.routes.js.map