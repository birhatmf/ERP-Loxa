import { AggregateRoot, generateId } from '@shared/types';

export type CategoryType = 'income' | 'expense' | 'project' | 'material';

interface CategoryProps {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Category extends AggregateRoot {
  private _name: string;
  private _type: CategoryType;
  private _color: string;
  private _icon: string;

  private constructor(props: CategoryProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this._name = props.name;
    this._type = props.type;
    this._color = props.color;
    this._icon = props.icon;
  }

  static create(params: {
    name: string;
    type: CategoryType;
    color?: string;
    icon?: string;
  }): Category {
    const now = new Date();
    return new Category({
      id: generateId(),
      name: params.name,
      type: params.type,
      color: params.color ?? '#6366f1',
      icon: params.icon ?? '',
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: CategoryProps): Category {
    return new Category(props);
  }

  get name(): string { return this._name; }
  get type(): CategoryType { return this._type; }
  get color(): string { return this._color; }
  get icon(): string { return this._icon; }

  updateInfo(params: {
    name?: string;
    type?: CategoryType;
    color?: string;
    icon?: string;
  }): void {
    if (params.name !== undefined) this._name = params.name;
    if (params.type !== undefined) this._type = params.type;
    if (params.color !== undefined) this._color = params.color;
    if (params.icon !== undefined) this._icon = params.icon;
    this.touch();
  }

  toSafeObject() {
    return {
      id: this.id,
      name: this._name,
      type: this._type,
      color: this._color,
      icon: this._icon,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
