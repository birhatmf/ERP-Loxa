import { AggregateRoot, generateId, BusinessRuleViolationError } from '@shared/types';
import { StockMovementType } from './inventory.enums';
import { StockMovementCreatedEvent } from '../events/inventory.events';

interface StockMovementProps {
  id: string;
  materialId: string;
  type: StockMovementType;
  quantity: number;
  description: string;
  relatedProjectId?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * StockMovement Aggregate Root.
 * Represents a stock change event.
 *
 * RULE: This is the ONLY way stock can change.
 */
export class StockMovement extends AggregateRoot {
  private _materialId: string;
  private _type: StockMovementType;
  private _quantity: number;
  private _description: string;
  private _relatedProjectId?: string;
  private _date: Date;

  private constructor(props: StockMovementProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this._materialId = props.materialId;
    this._type = props.type;
    this._quantity = props.quantity;
    this._description = props.description;
    this._relatedProjectId = props.relatedProjectId;
    this._date = props.date;
  }

  static create(params: {
    materialId: string;
    type: StockMovementType;
    quantity: number;
    description: string;
    relatedProjectId?: string;
    date?: Date;
  }): StockMovement {
    if (params.quantity <= 0) {
      throw new BusinessRuleViolationError('Stock movement quantity must be positive');
    }
    if (!params.materialId) {
      throw new BusinessRuleViolationError('Material ID is required');
    }

    const now = new Date();
    const movement = new StockMovement({
      id: generateId(),
      ...params,
      date: params.date ?? now,
      createdAt: now,
      updatedAt: now,
    });

    movement.addDomainEvent(
      new StockMovementCreatedEvent(
        movement.id,
        params.materialId,
        params.type,
        params.quantity
      )
    );

    return movement;
  }

  static reconstitute(props: StockMovementProps): StockMovement {
    return new StockMovement(props);
  }

  // --- Getters ---
  get materialId(): string { return this._materialId; }
  get type(): StockMovementType { return this._type; }
  get quantity(): number { return this._quantity; }
  get description(): string { return this._description; }
  get relatedProjectId(): string | undefined { return this._relatedProjectId; }
  get date(): Date { return this._date; }
  get isIn(): boolean { return this._type === StockMovementType.IN; }
  get isOut(): boolean { return this._type === StockMovementType.OUT; }
}
