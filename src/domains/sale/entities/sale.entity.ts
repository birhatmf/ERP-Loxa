import { AggregateRoot, generateId, Money } from '@shared/types';

export type SaleStatus = 'bekliyor' | 'kısmi' | 'ödendi';

interface SaleItemProps {
  id: string;
  description: string;
  quantity: number;
  unitPrice: Money;
  totalPrice: Money;
}

export class SaleItem {
  private constructor(
    public readonly id: string,
    public readonly description: string,
    public readonly quantity: number,
    public readonly unitPrice: Money,
    public readonly totalPrice: Money,
  ) {}

  static reconstitute(props: SaleItemProps): SaleItem {
    return new SaleItem(
      props.id,
      props.description,
      props.quantity,
      props.unitPrice,
      props.totalPrice,
    );
  }

  static create(params: {
    description: string;
    quantity: number;
    unitPrice: number;
  }): SaleItem {
    const unitPrice = Money.create(params.unitPrice);
    const totalPrice = unitPrice.multiply(params.quantity);
    return new SaleItem(
      generateId(),
      params.description,
      params.quantity,
      unitPrice,
      totalPrice,
    );
  }
}

interface SaleProps {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: SaleItem[];
  totalAmount: Money;
  paymentStatus: SaleStatus;
  paymentMethod: string;
  paymentNote: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Sale extends AggregateRoot {
  private _customerName: string;
  private _customerPhone: string;
  private _customerAddress: string;
  private _items: SaleItem[];
  private _totalAmount: Money;
  private _paymentStatus: SaleStatus;
  private _paymentMethod: string;
  private _paymentNote: string;
  private _description: string;

  private constructor(props: SaleProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this._customerName = props.customerName;
    this._customerPhone = props.customerPhone;
    this._customerAddress = props.customerAddress;
    this._items = props.items;
    this._totalAmount = props.totalAmount;
    this._paymentStatus = props.paymentStatus;
    this._paymentMethod = props.paymentMethod;
    this._paymentNote = props.paymentNote;
    this._description = props.description;
  }

  static create(params: {
    customerName: string;
    customerPhone?: string;
    customerAddress?: string;
    items: Array<{ description: string; quantity: number; unitPrice: number }>;
    paymentMethod?: string;
    paymentStatus?: SaleStatus;
    paymentNote?: string;
    description?: string;
  }): Sale {
    const now = new Date();
    const saleItems = params.items.map(item => SaleItem.create(item));
    const totalAmount = saleItems.reduce((sum, item) => sum.add(item.totalPrice), Money.create(0));

    return new Sale({
      id: generateId(),
      customerName: params.customerName,
      customerPhone: params.customerPhone ?? '',
      customerAddress: params.customerAddress ?? '',
      items: saleItems,
      totalAmount,
      paymentStatus: params.paymentStatus ?? 'bekliyor',
      paymentMethod: params.paymentMethod ?? 'nakit',
      paymentNote: params.paymentNote ?? '',
      description: params.description ?? '',
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: SaleProps): Sale {
    return new Sale(props);
  }

  get customerName(): string { return this._customerName; }
  get customerPhone(): string { return this._customerPhone; }
  get customerAddress(): string { return this._customerAddress; }
  get items(): SaleItem[] { return this._items; }
  get totalAmount(): Money { return this._totalAmount; }
  get paymentStatus(): SaleStatus { return this._paymentStatus; }
  get paymentMethod(): string { return this._paymentMethod; }
  get paymentNote(): string { return this._paymentNote; }
  get description(): string { return this._description; }

  updatePayment(params: {
    paymentStatus?: SaleStatus;
    paymentMethod?: string;
    paymentNote?: string;
  }): void {
    if (params.paymentStatus !== undefined) this._paymentStatus = params.paymentStatus;
    if (params.paymentMethod !== undefined) this._paymentMethod = params.paymentMethod;
    if (params.paymentNote !== undefined) this._paymentNote = params.paymentNote;
    this.touch();
  }

  updateInfo(params: {
    paymentStatus?: SaleStatus;
    paymentMethod?: string;
    paymentNote?: string;
    description?: string;
  }): void {
    this.updatePayment({
      paymentStatus: params.paymentStatus,
      paymentMethod: params.paymentMethod,
      paymentNote: params.paymentNote,
    });

    if (params.description !== undefined) {
      this._description = params.description;
      this.touch();
    }
  }

  toSafeObject() {
    return {
      id: this.id,
      customerName: this._customerName,
      customerPhone: this._customerPhone,
      customerAddress: this._customerAddress,
      items: this._items.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice.amount,
        totalPrice: item.totalPrice.amount,
      })),
      totalAmount: this._totalAmount.amount,
      paymentStatus: this._paymentStatus,
      paymentMethod: this._paymentMethod,
      paymentNote: this._paymentNote,
      description: this._description,
      createdAt: this.createdAt,
    };
  }
}
