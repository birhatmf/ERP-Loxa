// Entities
export { Material } from './entities/material.entity';
export { StockMovement } from './entities/stock-movement.entity';
export { StockMovementType, Unit } from './entities/inventory.enums';

// Events
export * from './events/inventory.events';

// Repositories
export type { IMaterialRepository } from './repositories/material.repository';
export type { IStockMovementRepository } from './repositories/stock-movement.repository';

// Services
export { StockService } from './services/stock.service';
