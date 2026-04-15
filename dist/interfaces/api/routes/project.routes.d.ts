import { Router } from 'express';
import { CreateProject, AddProjectItem, UpdateProjectInfo, DeleteProject, UpdateProjectStatus } from '@application/use-cases/project/project.use-cases';
import { IProjectFileRepository, IProjectRepository, CostCalculationService } from '@domains/project';
export declare function createProjectRoutes(createProject: CreateProject, addProjectItem: AddProjectItem, updateProjectInfo: UpdateProjectInfo, deleteProject: DeleteProject, updateProjectStatus: UpdateProjectStatus, costService: CostCalculationService, projectRepo: IProjectRepository, projectFileRepo: IProjectFileRepository): Router;
//# sourceMappingURL=project.routes.d.ts.map