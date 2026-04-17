import { AggregateRoot, generateId, Money } from '@shared/types';

export type BudgetType = 'income' | 'expense';

interface BudgetItemProps {
  id: string;
  category: string;
  type: BudgetType;
  planned: Money;
  period: string; // YYYY-MM format
  createdAt: Date;
  updatedAt: Date;
}

export class BudgetItem extends AggregateRoot {
  private _category: string;
  private _type: BudgetType;
  private _planned: Money;
  private _period: string;

  private constructor(props: BudgetItemProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this._category = props.category;
    this._type = props.type;
    this._planned = props.planned;
    this._period = props.period;
  }

  static create(params: {
    category: string;
    type: BudgetType;
    planned: number;
    period?: string;
  }): BudgetItem {
    const now = new Date();
    const period = params.period ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return new BudgetItem({
      id: generateId(),
      category: params.category,
      type: params.type,
      planned: Money.create(params.planned),
      period,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: BudgetItemProps): BudgetItem {
    return new BudgetItem(props);
  }

  get category(): string { return this._category; }
  get type(): BudgetType { return this._type; }
  get planned(): Money { return this._planned; }
  get period(): string { return this._period; }

  updateInfo(params: {
    category?: string;
    type?: BudgetType;
    planned?: number;
    period?: string;
  }): void {
    if (params.category !== undefined) this._category = params.category;
    if (params.type !== undefined) this._type = params.type;
    if (params.planned !== undefined) this._planned = Money.create(params.planned);
    if (params.period !== undefined) this._period = params.period;
    this.touch();
  }

  toSafeObject() {
    return {
      id: this.id,
      category: this._category,
      type: this._type,
      planned: this._planned.amount,
      period: this._period,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
