import { Router } from 'express';
import { CreateProject, AddProjectItem, UpdateProjectInfo, DeleteProject, UpdateProjectStatus } from '../../../application/use-cases/project/project.use-cases';
import { IProjectFileRepository, IProjectRepository, CostCalculationService } from '../../../domains/project';
import { ISaleRepository } from '../../../domains/sale/repositories/sale.repository';
export declare function createProjectRoutes(createProject: CreateProject, addProjectItem: AddProjectItem, updateProjectInfo: UpdateProjectInfo, deleteProject: DeleteProject, updateProjectStatus: UpdateProjectStatus, costService: CostCalculationService, projectRepo: IProjectRepository, projectFileRepo: IProjectFileRepository, saleRepo?: ISaleRepository): Router;
//# sourceMappingURL=project.routes.d.ts.map