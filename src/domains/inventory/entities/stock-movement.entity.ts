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
  isCorrection?: boolean;
  correctionReason?: string | null;
  correctedAt?: Date | null;
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
  private _isCorrection: boolean;
  private _correctionReason: string | null;
  private _correctedAt: Date | null;

  private constructor(props: StockMovementProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this._materialId = props.materialId;
    this._type = props.type;
    this._quantity = props.quantity;
    this._description = props.description;
    this._relatedProjectId = props.relatedProjectId;
    this._date = props.date;
    this._isCorrection = props.isCorrection ?? false;
    this._correctionReason = props.correctionReason ?? null;
    this._correctedAt = props.correctedAt ?? null;
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
      isCorrection: false,
      correctionReason: null,
      correctedAt: null,
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
  get isCorrection(): boolean { return this._isCorrection; }
  get correctionReason(): string | null { return this._correctionReason; }
  get correctedAt(): Date | null { return this._correctedAt; }
  get isIn(): boolean { return this._type === StockMovementType.IN; }
  get isOut(): boolean { return this._type === StockMovementType.OUT; }

  markAsCorrection(reason: string): void {
    this._isCorrection = true;
    this._correctionReason = reason;
    this._correctedAt = new Date();
    this.touch();
  }

  updateDetails(params: {
    materialId?: string;
    type?: StockMovementType;
    quantity?: number;
    description?: string;
    date?: Date;
  }): void {
    if (params.materialId !== undefined) {
      if (!params.materialId.trim()) {
        throw new BusinessRuleViolationError('Material ID is required');
      }
      this._materialId = params.materialId;
    }
    if (params.type !== undefined) {
      this._type = params.type;
    }
    if (params.quantity !== undefined) {
      if (params.quantity <= 0) {
        throw new BusinessRuleViolationError('Stock movement quantity must be positive');
      }
      this._quantity = params.quantity;
    }
    if (params.description !== undefined) {
      this._description = params.description;
    }
    if (params.date !== undefined) {
      this._date = params.date;
    }
    this.touch();
  }
}
