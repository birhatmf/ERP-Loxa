"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddStock = exports.CreateMaterial = void 0;
const inventory_1 = require("@domains/inventory");
/**
 * CreateMaterial Use Case
 * Creates a new material in the inventory catalog.
 */
class CreateMaterial {
    materialRepo;
    eventBus;
    constructor(materialRepo, eventBus) {
        this.materialRepo = materialRepo;
        this.eventBus = eventBus;
    }
    async execute(params) {
        // Check for duplicates
        const existing = await this.materialRepo.findByName(params.name);
        if (existing) {
            throw new Error(`Material already exists: ${params.name}`);
        }
        const material = inventory_1.Material.create({
            name: params.name,
            unit: params.unit,
            minStockLevel: params.minStockLevel,
        });
        await this.materialRepo.save(material);
        await this.eventBus.publishAll(material.domainEvents);
        material.clearEvents();
        return material;
    }
}
exports.CreateMaterial = CreateMaterial;
/**
 * AddStock Use Case
 * Handles purchasing material (stock IN).
 * Creates both a StockMovement and a Transaction (expense).
 */
class AddStock {
    stockService;
    eventBus;
    constructor(stockService, eventBus) {
        this.stockService = stockService;
        this.eventBus = eventBus;
    }
    async execute(params) {
        await this.stockService.addStock({
            materialId: params.materialId,
            quantity: params.quantity,
            description: params.description,
            date: params.date,
        });
    }
}
exports.AddStock = AddStock;
//# sourceMappingURL=inventory.use-cases.js.map