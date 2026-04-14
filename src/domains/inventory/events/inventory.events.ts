import { DomainEvent } from '@shared/types';
import { StockMovementType } from '../entities/inventory.enums';

/**
 * Fired when a stock movement is created.
 */
export class StockMovementCreatedEvent extends DomainEvent {
  public readonly materialId: string;
  public readonly movementType: StockMovementType;
  public readonly quantity: number;

  constructor(
    movementId: string,
    materialId: string,
    movementType: StockMovementType,
    quantity: number
  ) {
    super(movementId, 'StockMovementCreated');
    this.materialId = materialId;
    this.movementType = movementType;
    this.quantity = quantity;
  }
}

/**
 * Fired when stock is adjusted (increase or decrease).
 */
export class StockAdjustedEvent extends DomainEvent {
  public readonly materialName: string;
  public readonly adjustmentType: 'IN' | 'OUT';
  public readonly quantity: number;
  public readonly newStockLevel: number;

  constructor(
    materialId: string,
    materialName: string,
    adjustmentType: 'IN' | 'OUT',
    quantity: number,
    newStockLevel: number
  ) {
    super(materialId, 'StockAdjusted');
    this.materialName = materialName;
    this.adjustmentType = adjustmentType;
    this.quantity = quantity;
    this.newStockLevel = newStockLevel;
  }
}

/**
 * Fired when stock drops to or below minimum level.
 */
export class LowStockWarningEvent extends DomainEvent {
  public readonly materialName: string;
  public readonly currentStock: number;
  public readonly minStockLevel: number;

  constructor(
    materialId: string,
    materialName: string,
    currentStock: number,
    minStockLevel: number
  ) {
    super(materialId, 'LowStockWarning');
    this.materialName = materialName;
    this.currentStock = currentStock;
    this.minStockLevel = minStockLevel;
  }
}
