import { Router } from 'express';
import { CreateProject, AddProjectItem } from '@application/use-cases/project/project.use-cases';
import { IProjectRepository, CostCalculationService } from '@domains/project';
export declare function createProjectRoutes(createProject: CreateProject, addProjectItem: AddProjectItem, costService: CostCalculationService, projectRepo: IProjectRepository): Router;
//# sourceMappingURL=project.routes.d.ts.map