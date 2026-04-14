import { Entity, Money, generateId, BusinessRuleViolationError } from '@shared/types';

interface InvoiceItemProps {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: Money;
  vatRate: number; // percentage, e.g. 18 for 18%
  totalPrice: Money;
  vatAmount: Money;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * InvoiceItem Entity.
 * A line item on an invoice.
 */
export class InvoiceItem extends Entity {
  private _invoiceId: string;
  private _description: string;
  private _quantity: number;
  private _unitPrice: Money;
  private _vatRate: number;
  private _totalPrice: Money;
  private _vatAmount: Money;

  private constructor(props: InvoiceItemProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this._invoiceId = props.invoiceId;
    this._description = props.description;
    this._quantity = props.quantity;
    this._unitPrice = props.unitPrice;
    this._vatRate = props.vatRate;
    this._totalPrice = props.totalPrice;
    this._vatAmount = props.vatAmount;
  }

  static create(params: {
    invoiceId: string;
    description: string;
    quantity: number;
    unitPrice: Money;
    vatRate: number;
  }): InvoiceItem {
    if (!params.description || params.description.trim().length === 0) {
      throw new BusinessRuleViolationError('Invoice item description is required');
    }
    if (params.quantity <= 0) {
      throw new BusinessRuleViolationError('Invoice item quantity must be positive');
    }
    if (params.vatRate < 0 || params.vatRate > 100) {
      throw new BusinessRuleViolationError('VAT rate must be between 0 and 100');
    }

    const totalPrice = params.unitPrice.multiply(params.quantity);
    const vatAmount = totalPrice.multiply(params.vatRate / 100);

    const now = new Date();
    return new InvoiceItem({
      id: generateId(),
      invoiceId: params.invoiceId,
      description: params.description.trim(),
      quantity: params.quantity,
      unitPrice: params.unitPrice,
      vatRate: params.vatRate,
      totalPrice,
      vatAmount,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: InvoiceItemProps): InvoiceItem {
    return new InvoiceItem(props);
  }

  // --- Getters ---
  get invoiceId(): string { return this._invoiceId; }
  get description(): string { return this._description; }
  get quantity(): number { return this._quantity; }
  get unitPrice(): Money { return this._unitPrice; }
  get vatRate(): number { return this._vatRate; }
  get totalPrice(): Money { return this._totalPrice; }
  get vatAmount(): Money { return this._vatAmount; }
  get totalWithVat(): Money { return this._totalPrice.add(this._vatAmount); }
}
