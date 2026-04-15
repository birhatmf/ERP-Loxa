import { AggregateRoot } from '@shared/types';
import { StockMovementType } from './inventory.enums';
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
export declare class StockMovement extends AggregateRoot {
    private _materialId;
    private _type;
    private _quantity;
    private _description;
    private _relatedProjectId?;
    private _date;
    private constructor();
    static create(params: {
        materialId: string;
        type: StockMovementType;
        quantity: number;
        description: string;
        relatedProjectId?: string;
        date?: Date;
    }): StockMovement;
    static reconstitute(props: StockMovementProps): StockMovement;
    get materialId(): string;
    get type(): StockMovementType;
    get quantity(): number;
    get description(): string;
    get relatedProjectId(): string | undefined;
    get date(): Date;
    get isIn(): boolean;
    get isOut(): boolean;
}
export {};
//# sourceMappingURL=stock-movement.entity.d.ts.map