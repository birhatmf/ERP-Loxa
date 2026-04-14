import { IRepository } from '@shared/types/repository.interface';
import { StockMovement } from '../entities/stock-movement.entity';
import { StockMovementType } from '../entities/inventory.enums';

/**
 * Repository interface for StockMovement aggregate.
 */
export interface IStockMovementRepository extends IRepository<StockMovement> {
  findByMaterial(materialId: string): Promise<StockMovement[]>;
  findByProject(projectId: string): Promise<StockMovement[]>;
  findByType(type: StockMovementType): Promise<StockMovement[]>;
  findByDateRange(from: Date, to: Date): Promise<StockMovement[]>;
}
