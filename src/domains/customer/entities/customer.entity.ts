import { AggregateRoot, generateId, Money } from '@shared/types';

interface CustomerProps {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  taxId: string;
  notes: string;
  totalPurchases: Money;
  outstandingBalance: Money;
  createdAt: Date;
  updatedAt: Date;
}

export class Customer extends AggregateRoot {
  private _name: string;
  private _phone: string;
  private _email: string;
  private _address: string;
  private _taxId: string;
  private _notes: string;
  private _totalPurchases: Money;
  private _outstandingBalance: Money;

  private constructor(props: CustomerProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this._name = props.name;
    this._phone = props.phone;
    this._email = props.email;
    this._address = props.address;
    this._taxId = props.taxId;
    this._notes = props.notes;
    this._totalPurchases = props.totalPurchases;
    this._outstandingBalance = props.outstandingBalance;
  }

  static create(params: {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    taxId?: string;
    notes?: string;
  }): Customer {
    const now = new Date();
    return new Customer({
      id: generateId(),
      name: params.name,
      phone: params.phone ?? '',
      email: params.email ?? '',
      address: params.address ?? '',
      taxId: params.taxId ?? '',
      notes: params.notes ?? '',
      totalPurchases: Money.create(0),
      outstandingBalance: Money.create(0),
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: CustomerProps): Customer {
    return new Customer(props);
  }

  get name(): string { return this._name; }
  get phone(): string { return this._phone; }
  get email(): string { return this._email; }
  get address(): string { return this._address; }
  get taxId(): string { return this._taxId; }
  get notes(): string { return this._notes; }
  get totalPurchases(): Money { return this._totalPurchases; }
  get outstandingBalance(): Money { return this._outstandingBalance; }

  updateInfo(params: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    taxId?: string;
    notes?: string;
  }): void {
    if (params.name !== undefined) this._name = params.name;
    if (params.phone !== undefined) this._phone = params.phone;
    if (params.email !== undefined) this._email = params.email;
    if (params.address !== undefined) this._address = params.address;
    if (params.taxId !== undefined) this._taxId = params.taxId;
    if (params.notes !== undefined) this._notes = params.notes;
    this.touch();
  }

  addPurchase(amount: Money): void {
    this._totalPurchases = this._totalPurchases.add(amount);
    this.touch();
  }

  updateOutstandingBalance(amount: Money): void {
    this._outstandingBalance = amount;
    this.touch();
  }

  toSafeObject() {
    return {
      id: this.id,
      name: this._name,
      phone: this._phone,
      email: this._email,
      address: this._address,
      taxId: this._taxId,
      notes: this._notes,
      totalPurchases: this._totalPurchases.amount,
      outstandingBalance: this._outstandingBalance.amount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
