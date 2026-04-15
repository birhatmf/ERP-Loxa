import { IRepository } from '@shared/types/repository.interface';
import { Project } from '../entities/project.entity';
import { ProjectStatus } from '../entities/project.enums';
/**
 * Repository interface for Project aggregate.
 */
export interface IProjectRepository extends IRepository<Project> {
    findByCustomer(customerName: string): Promise<Project[]>;
    findByStatus(status: ProjectStatus): Promise<Project[]>;
    findActive(): Promise<Project[]>;
}
//# sourceMappingURL=project.repository.d.ts.map