import { IRepository } from '@shared/types/repository.interface';
import { Check } from '../entities/check.entity';
import { CheckType, CheckStatus } from '../entities/payment.enums';
/**
 * Repository interface for Check aggregate.
 */
export interface ICheckRepository extends IRepository<Check> {
    findByStatus(status: CheckStatus): Promise<Check[]>;
    findByType(type: CheckType): Promise<Check[]>;
    findPending(): Promise<Check[]>;
    findOverdue(): Promise<Check[]>;
    findByDueDateRange(from: Date, to: Date): Promise<Check[]>;
    findByProject(projectId: string): Promise<Check[]>;
}
//# sourceMappingURL=check.repository.d.ts.map