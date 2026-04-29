import { AggregateRoot } from '../../../shared/types';
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
export declare class Category extends AggregateRoot {
    private _name;
    private _type;
    private _color;
    private _icon;
    private constructor();
    static create(params: {
        name: string;
        type: CategoryType;
        color?: string;
        icon?: string;
    }): Category;
    static reconstitute(props: CategoryProps): Category;
    get name(): string;
    get type(): CategoryType;
    get color(): string;
    get icon(): string;
    updateInfo(params: {
        name?: string;
        type?: CategoryType;
        color?: string;
        icon?: string;
    }): void;
    toSafeObject(): {
        id: string;
        name: string;
        type: CategoryType;
        color: string;
        icon: string;
        createdAt: Date;
        updatedAt: Date;
    };
}
export {};
//# sourceMappingURL=category.entity.d.ts.map