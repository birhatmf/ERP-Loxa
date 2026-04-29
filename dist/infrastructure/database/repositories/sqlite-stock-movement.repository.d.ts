import { Knex } from 'knex';
import { IStockMovementRepository, StockMovement, StockMovementType } from '../../../domains/inventory';
export declare class SqliteStockMovementRepository implements IStockMovementRepository {
    private knex;
    constructor(knex: Knex);
    findById(id: string): Promise<StockMovement | null>;
    findAll(): Promise<StockMovement[]>;
    save(entity: StockMovement): Promise<void>;
    delete(id: string): Promise<void>;
    findByMaterial(materialId: string): Promise<StockMovement[]>;
    findByProject(projectId: string): Promise<StockMovement[]>;
    findByType(type: StockMovementType): Promise<StockMovement[]>;
    findByDateRange(from: Date, to: Date): Promise<StockMovement[]>;
    private toDomain;
    private toPersistence;
}
//# sourceMappingURL=sqlite-stock-movement.repository.d.ts.map