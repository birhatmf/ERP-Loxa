import { Entity, Money, generateId, BusinessRuleViolationError } from '@shared/types';

interface ProjectItemProps {
  id: string;
  projectId: string;
  materialId: string;
  quantity: number;
  unitPrice: Money;
  totalPrice: Money;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ProjectItem Entity.
 * Represents a material used in a project.
 * Items are part of the Project aggregate - they cannot exist without a project.
 */
export class ProjectItem extends Entity {
  private _projectId: string;
  private _materialId: string;
  private _quantity: number;
  private _unitPrice: Money;
  private _totalPrice: Money;

  private constructor(props: ProjectItemProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this._projectId = props.projectId;
    this._materialId = props.materialId;
    this._quantity = props.quantity;
    this._unitPrice = props.unitPrice;
    this._totalPrice = props.totalPrice;
  }

  static create(params: {
    projectId: string;
    materialId: string;
    quantity: number;
    unitPrice: Money;
  }): ProjectItem {
    if (params.quantity <= 0) {
      throw new BusinessRuleViolationError('Project item quantity must be positive');
    }
    if (!params.materialId) {
      throw new BusinessRuleViolationError('Material ID is required');
    }

    const totalPrice = params.unitPrice.multiply(params.quantity);

    const now = new Date();
    return new ProjectItem({
      id: generateId(),
      projectId: params.projectId,
      materialId: params.materialId,
      quantity: params.quantity,
      unitPrice: params.unitPrice,
      totalPrice,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: ProjectItemProps): ProjectItem {
    return new ProjectItem(props);
  }

  // --- Getters ---
  get projectId(): string { return this._projectId; }
  get materialId(): string { return this._materialId; }
  get quantity(): number { return this._quantity; }
  get unitPrice(): Money { return this._unitPrice; }
  get totalPrice(): Money { return this._totalPrice; }

  /**
   * Recalculate total price (e.g. if unit price changes).
   */
  recalculateTotal(): void {
    this._totalPrice = this._unitPrice.multiply(this._quantity);
    this.updatedAt = new Date();
  }

  /**
   * Update quantity.
   */
  updateQuantity(newQuantity: number): void {
    if (newQuantity <= 0) {
      throw new BusinessRuleViolationError('Project item quantity must be positive');
    }
    this._quantity = newQuantity;
    this.recalculateTotal();
  }

  /**
   * Update unit price.
   */
  updateUnitPrice(newPrice: Money): void {
    this._unitPrice = newPrice;
    this.recalculateTotal();
  }
}
