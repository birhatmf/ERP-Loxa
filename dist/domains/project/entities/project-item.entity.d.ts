import { Entity, Money } from '@shared/types';
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
export declare class ProjectItem extends Entity {
    private _projectId;
    private _materialId;
    private _quantity;
    private _unitPrice;
    private _totalPrice;
    private constructor();
    static create(params: {
        projectId: string;
        materialId: string;
        quantity: number;
        unitPrice: Money;
    }): ProjectItem;
    static reconstitute(props: ProjectItemProps): ProjectItem;
    get projectId(): string;
    get materialId(): string;
    get quantity(): number;
    get unitPrice(): Money;
    get totalPrice(): Money;
    /**
     * Recalculate total price (e.g. if unit price changes).
     */
    recalculateTotal(): void;
    /**
     * Update quantity.
     */
    updateQuantity(newQuantity: number): void;
    /**
     * Update unit price.
     */
    updateUnitPrice(newPrice: Money): void;
}
export {};
//# sourceMappingURL=project-item.entity.d.ts.map