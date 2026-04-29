import { Sale } from '../entities/sale.entity';
export interface ISaleRepository {
    findById(id: string): Promise<Sale | null>;
    findAll(): Promise<Sale[]>;
    save(entity: Sale): Promise<void>;
    delete(id: string): Promise<void>;
}
//# sourceMappingURL=sale.repository.d.ts.map