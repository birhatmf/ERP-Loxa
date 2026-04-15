import { AggregateRoot, generateId, BusinessRuleViolationError } from '@shared/types';
import { Unit } from './inventory.enums';
import { StockAdjustedEvent, LowStockWarningEvent } from '../events/inventory.events';

interface MaterialProps {
  id: string;
  name: string;
  unit: Unit;
  currentStock: number;
  minStockLevel: number;
  manualPrice?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Material Aggregate Root.
 * Represents a material type in inventory.
 *
 * RULE: Stock can ONLY be changed through StockMovements, never manually.
 */
export class Material extends AggregateRoot {
  private _name: string;
  private _unit: Unit;
  private _currentStock: number;
  private _minStockLevel: number;
  private _manualPrice: number | null;

  private constructor(props: MaterialProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this._name = props.name;
    this._unit = props.unit;
    this._currentStock = props.currentStock;
    this._minStockLevel = props.minStockLevel;
    this._manualPrice = props.manualPrice ?? null;
  }

  static create(params: { name: string; unit: Unit; minStockLevel: number }): Material {
    if (!params.name || params.name.trim().length === 0) {
      throw new BusinessRuleViolationError('Material name cannot be empty');
    }
    if (params.minStockLevel < 0) {
      throw new BusinessRuleViolationError('Minimum stock level cannot be negative');
    }

    const now = new Date();
    return new Material({
      id: generateId(),
      name: params.name.trim(),
      unit: params.unit,
      currentStock: 0,
      minStockLevel: params.minStockLevel,
      manualPrice: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: MaterialProps): Material {
    return new Material(props);
  }

  // --- Getters ---
  get name(): string { return this._name; }
  get unit(): Unit { return this._unit; }
  get currentStock(): number { return this._currentStock; }
  get minStockLevel(): number { return this._minStockLevel; }
  get manualPrice(): number | null { return this._manualPrice; }
  get isLowStock(): boolean { return this._currentStock <= this._minStockLevel; }

  // --- Domain behavior (called by StockService, not directly) ---

  /**
   * Increase stock. Called internally by domain service.
   */
  increaseStock(quantity: number): void {
    if (quantity <= 0) {
      throw new BusinessRuleViolationError('Stock increase quantity must be positive');
    }
    this._currentStock += quantity;
    this.touch();

    this.addDomainEvent(
      new StockAdjustedEvent(this.id, this._name, 'IN', quantity, this._currentStock)
    );
  }

  /**
   * Decrease stock. Called internally by domain service.
   */
  decreaseStock(quantity: number): void {
    if (quantity <= 0) {
      throw new BusinessRuleViolationError('Stock decrease quantity must be positive');
    }
    if (quantity > this._currentStock) {
      throw new BusinessRuleViolationError(
        `Insufficient stock for '${this._name}': requested ${quantity}, available ${this._currentStock}`
      );
    }

    this._currentStock -= quantity;
    this.touch();

    this.addDomainEvent(
      new StockAdjustedEvent(this.id, this._name, 'OUT', quantity, this._currentStock)
    );

    // Check if stock is now low
    if (this.isLowStock) {
      this.addDomainEvent(
        new LowStockWarningEvent(this.id, this._name, this._currentStock, this._minStockLevel)
      );
    }
  }

  /**
   * Update material info (name, unit, min stock level).
   */
  updateInfo(params: { name?: string; unit?: Unit; minStockLevel?: number; manualPrice?: number | null }): void {
    if (params.name !== undefined) {
      if (!params.name || params.name.trim().length === 0) {
        throw new BusinessRuleViolationError('Material name cannot be empty');
      }
      this._name = params.name.trim();
    }
    if (params.unit !== undefined) {
      this._unit = params.unit;
    }
    if (params.minStockLevel !== undefined) {
      if (params.minStockLevel < 0) {
        throw new BusinessRuleViolationError('Minimum stock level cannot be negative');
      }
      this._minStockLevel = params.minStockLevel;
    }
    if (params.manualPrice !== undefined) {
      this.setManualPrice(params.manualPrice);
    }
    this.touch();
  }

  /**
   * Set manual purchase price override.
   */
  setManualPrice(price: number | null): void {
    if (price !== null && price !== undefined && price < 0) {
      throw new BusinessRuleViolationError('Manual price cannot be negative');
    }
    this._manualPrice = price ?? null;
    this.touch();
  }

  /**
   * Rebuild current stock from stock movement history.
   */
  rebuildStock(newStock: number): void {
    if (newStock < 0) {
      throw new BusinessRuleViolationError('Stock cannot be negative');
    }
    this._currentStock = newStock;
    this.touch();
  }
}
