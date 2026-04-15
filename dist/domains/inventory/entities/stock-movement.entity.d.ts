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
export declare class StockMovement extends AggregateRoot {
    private _materialId;
    private _type;
    private _quantity;
    private _description;
    private _relatedProjectId?;
    private _date;
    private _isCorrection;
    private _correctionReason;
    private _correctedAt;
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
    get isCorrection(): boolean;
    get correctionReason(): string | null;
    get correctedAt(): Date | null;
    get isIn(): boolean;
    get isOut(): boolean;
    markAsCorrection(reason: string): void;
    updateDetails(params: {
        materialId?: string;
        type?: StockMovementType;
        quantity?: number;
        description?: string;
        date?: Date;
    }): void;
}
export {};
//# sourceMappingURL=stock-movement.entity.d.ts.map