"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockService = void 0;
const stock_movement_entity_1 = require("../entities/stock-movement.entity");
const inventory_enums_1 = require("../entities/inventory.enums");
const domain_errors_1 = require("@shared/errors/domain.errors");
/**
 * StockService - Domain Service
 * Manages stock operations, ensuring all stock changes go through movements.
 *
 * RULE: Stock is NEVER updated manually. Always through a StockMovement.
 */
class StockService {
    materialRepo;
    movementRepo;
    eventBus;
    constructor(materialRepo, movementRepo, eventBus) {
        this.materialRepo = materialRepo;
        this.movementRepo = movementRepo;
        this.eventBus = eventBus;
    }
    /**
     * Add stock via a new IN movement.
     */
    async addStock(params) {
        const material = await this.materialRepo.findById(params.materialId);
        if (!material) {
            throw new Error(`Material not found: ${params.materialId}`);
        }
        // Create the movement
        const movement = stock_movement_entity_1.StockMovement.create({
            materialId: params.materialId,
            type: inventory_enums_1.StockMovementType.IN,
            quantity: params.quantity,
            description: params.description,
            relatedProjectId: params.relatedProjectId,
            date: params.date,
        });
        // Adjust stock on material (aggregate internal behavior)
        material.increaseStock(params.quantity);
        // Persist both
        await this.movementRepo.save(movement);
        await this.materialRepo.save(material);
        // Publish events
        await this.eventBus.publishAll(movement.domainEvents);
        await this.eventBus.publishAll(material.domainEvents);
        movement.clearEvents();
        material.clearEvents();
        return { movement, material };
    }
    /**
     * Remove stock via a new OUT movement.
     * Throws InsufficientStockError if not enough stock.
     */
    async removeStock(params) {
        const material = await this.materialRepo.findById(params.materialId);
        if (!material) {
            throw new Error(`Material not found: ${params.materialId}`);
        }
        if (params.quantity > material.currentStock) {
            throw new domain_errors_1.InsufficientStockError(material.name, params.quantity, material.currentStock);
        }
        // Create the movement
        const movement = stock_movement_entity_1.StockMovement.create({
            materialId: params.materialId,
            type: inventory_enums_1.StockMovementType.OUT,
            quantity: params.quantity,
            description: params.description,
            relatedProjectId: params.relatedProjectId,
            date: params.date,
        });
        // Adjust stock on material
        material.decreaseStock(params.quantity);
        // Persist both
        await this.movementRepo.save(movement);
        await this.materialRepo.save(material);
        // Publish events
        await this.eventBus.publishAll(movement.domainEvents);
        await this.eventBus.publishAll(material.domainEvents);
        movement.clearEvents();
        material.clearEvents();
        return { movement, material };
    }
    /**
     * Get stock level for a material.
     */
    async getStockLevel(materialId) {
        const material = await this.materialRepo.findById(materialId);
        if (!material) {
            throw new Error(`Material not found: ${materialId}`);
        }
        return material.currentStock;
    }
    /**
     * Get all materials with low stock.
     */
    async getLowStockMaterials() {
        return this.materialRepo.findLowStock();
    }
    /**
     * Get stock history for a material.
     */
    async getStockHistory(materialId) {
        return this.movementRepo.findByMaterial(materialId);
    }
}
exports.StockService = StockService;
//# sourceMappingURL=stock.service.js.map