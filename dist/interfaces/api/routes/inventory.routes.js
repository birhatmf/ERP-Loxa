"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInventoryRoutes = createInventoryRoutes;
const express_1 = require("express");
const inventory_1 = require("@domains/inventory");
const logger_1 = require("@shared/logger");
function createInventoryRoutes(createMaterial, addStock, stockService, materialRepo, purchaseOrderRepo, stockMovementRepo) {
    const router = (0, express_1.Router)();
    async function buildLatestPurchasePriceMap() {
        const orders = await purchaseOrderRepo.findAll();
        const latest = new Map();
        for (const order of orders) {
            const purchasedAt = order.receivedDate || order.updatedAt || order.createdAt;
            for (const item of order.items) {
                if (!latest.has(item.materialId)) {
                    latest.set(item.materialId, {
                        price: item.unitPrice,
                        purchasedAt,
                    });
                }
            }
        }
        return latest;
    }
    async function recalculateMaterialStock(materialId) {
        const material = await materialRepo.findById(materialId);
        if (!material)
            return;
        const movements = await stockMovementRepo.findByMaterial(materialId);
        const newStock = movements.reduce((sum, movement) => {
            return sum + (movement.isIn ? movement.quantity : -movement.quantity);
        }, 0);
        material.rebuildStock(newStock);
        await materialRepo.save(material);
    }
    function toMaterialResponse(material, latestPrices) {
        const currentPrice = material.manualPrice ?? latestPrices.get(material.id)?.price ?? null;
        const totalValue = currentPrice !== null ? material.currentStock * currentPrice : null;
        return {
            id: material.id,
            name: material.name,
            unit: material.unit,
            currentStock: material.currentStock,
            minStockLevel: material.minStockLevel,
            isLowStock: material.isLowStock,
            manualPrice: material.manualPrice ?? null,
            currentPrice,
            totalValue,
            lastPurchasedAt: latestPrices.get(material.id)?.purchasedAt ?? null,
        };
    }
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
                manualPrice: material.manualPrice ?? null,
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
            const latestPrices = await buildLatestPurchasePriceMap();
            res.json(materials.map(m => toMaterialResponse(m, latestPrices)));
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
            const latestPrices = await buildLatestPurchasePriceMap();
            res.json(lowStock.map(m => toMaterialResponse(m, latestPrices)));
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
    // PATCH /materials/:id - Update material fields and manual price
    router.patch('/materials/:id', async (req, res) => {
        try {
            const material = await materialRepo.findById(req.params.id);
            if (!material) {
                return res.status(404).json({ error: 'Material not found' });
            }
            const { name, unit, minStockLevel, manualPrice } = req.body;
            material.updateInfo({
                name,
                unit: unit,
                minStockLevel: minStockLevel !== undefined ? Number(minStockLevel) : undefined,
            });
            if (manualPrice !== undefined) {
                material.setManualPrice(manualPrice === null || manualPrice === '' ? null : Number(manualPrice));
            }
            await materialRepo.save(material);
            const latestPrices = await buildLatestPurchasePriceMap();
            logger_1.logger.info('Material updated', { id: material.id, name: material.name });
            res.json(toMaterialResponse(material, latestPrices));
        }
        catch (error) {
            logger_1.logger.error('Failed to update material', { error: error.message, id: req.params.id, body: req.body });
            res.status(400).json({ error: error.message });
        }
    });
    // GET /materials/:id/history - Get stock history
    router.get('/materials/:id/history', async (req, res) => {
        try {
            const movements = await stockService.getStockHistory(req.params.id);
            res.json(movements.map(m => ({
                id: m.id,
                materialId: m.materialId,
                type: m.type,
                quantity: m.quantity,
                description: m.description,
                createdAt: m.date.toISOString(),
                isCorrection: m.isCorrection,
                correctionReason: m.correctionReason,
            })));
        }
        catch (error) {
            logger_1.logger.error('Failed to get stock history', { error: error.message, materialId: req.params.id });
            res.status(500).json({ error: error.message });
        }
    });
    // PATCH /materials/:id/history/:movementId - Correct a stock movement
    router.patch('/materials/:id/history/:movementId', async (req, res) => {
        try {
            const material = await materialRepo.findById(req.params.id);
            if (!material) {
                return res.status(404).json({ error: 'Material not found' });
            }
            const movement = await stockMovementRepo.findById(req.params.movementId);
            if (!movement || movement.materialId !== req.params.id) {
                return res.status(404).json({ error: 'Stock movement not found' });
            }
            const previousMaterialId = movement.materialId;
            const nextMaterialId = req.body.materialId ? String(req.body.materialId) : previousMaterialId;
            const nextQuantity = req.body.quantity !== undefined ? Number(req.body.quantity) : movement.quantity;
            const nextType = req.body.type ? String(req.body.type) : movement.type;
            const nextDescription = req.body.description !== undefined ? String(req.body.description) : movement.description;
            const nextDate = req.body.date ? new Date(req.body.date) : movement.date;
            const correctionReason = String(req.body.correctionReason ?? req.body.description ?? 'Stok hareketi düzeltildi');
            if (!nextMaterialId) {
                return res.status(400).json({ error: 'Material is required' });
            }
            if (nextQuantity <= 0) {
                return res.status(400).json({ error: 'Quantity must be positive' });
            }
            if (![inventory_1.StockMovementType.IN, inventory_1.StockMovementType.OUT].includes(nextType)) {
                return res.status(400).json({ error: 'Invalid movement type' });
            }
            movement.updateDetails({
                materialId: nextMaterialId,
                type: nextType,
                quantity: nextQuantity,
                description: nextDescription,
                date: nextDate,
            });
            movement.markAsCorrection(correctionReason);
            await stockMovementRepo.save(movement);
            await recalculateMaterialStock(previousMaterialId);
            if (nextMaterialId !== previousMaterialId) {
                await recalculateMaterialStock(nextMaterialId);
            }
            const latestPrices = await buildLatestPurchasePriceMap();
            const updatedMaterial = await materialRepo.findById(nextMaterialId);
            logger_1.logger.info('Stock movement corrected', { movementId: movement.id, materialId: nextMaterialId });
            res.json({
                movement: {
                    id: movement.id,
                    materialId: movement.materialId,
                    type: movement.type,
                    quantity: movement.quantity,
                    description: movement.description,
                    date: movement.date,
                    isCorrection: movement.isCorrection,
                    correctionReason: movement.correctionReason,
                },
                material: updatedMaterial ? toMaterialResponse(updatedMaterial, latestPrices) : null,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to correct stock movement', { error: error.message, id: req.params.movementId, body: req.body });
            res.status(400).json({ error: error.message });
        }
    });
    return router;
}
//# sourceMappingURL=inventory.routes.js.map