import { Request, Response, Router } from 'express';
import { CreateProject, AddProjectItem, UpdateProjectStatus } from '@application/use-cases/project/project.use-cases';
import { IProjectRepository, ProjectStatus, CostCalculationService } from '@domains/project';

export function createProjectRoutes(
  createProject: CreateProject,
  addProjectItem: AddProjectItem,
  updateProjectStatus: UpdateProjectStatus,
  costService: CostCalculationService,
  projectRepo: IProjectRepository
): Router {
  const router = Router();

  // POST /projects - Create a new project
  router.post('/projects', async (req: Request, res: Response) => {
    try {
      const { name, customerName, description, totalPrice } = req.body;

      const project = await createProject.execute({
        name,
        customerName,
        description,
        totalPrice,
      });

      res.status(201).json({
        id: project.id,
        name: project.name,
        customerName: project.customerName,
        status: project.status,
        totalPrice: project.totalPrice.amount,
        createdAt: project.createdAt,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // GET /projects - List all projects
  router.get('/projects', async (req: Request, res: Response) => {
    try {
      const projects = await projectRepo.findAll();
      res.json(projects.map(p => ({
        id: p.id,
        name: p.name,
        customerName: p.customerName,
        status: p.status,
        totalPrice: p.totalPrice.amount,
        itemCount: p.itemCount,
        totalCost: p.totalCost.amount,
        profitMargin: p.profitMargin.amount,
        createdAt: p.createdAt,
      })));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /projects/:id - Get project details
  router.get('/projects/:id', async (req: Request, res: Response) => {
    try {
      const project = await projectRepo.findById(req.params.id);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const cost = await costService.calculateAndEmit(project);

      res.json({
        id: project.id,
        name: project.name,
        customerName: project.customerName,
        description: project.description,
        status: project.status,
        totalPrice: project.totalPrice.amount,
        totalCost: cost.totalCost.amount,
        profitMargin: cost.profitMargin.amount,
        profitMarginPercentage: cost.profitMarginPercentage,
        items: project.items.map(i => ({
          id: i.id,
          materialId: i.materialId,
          quantity: i.quantity,
          unitPrice: i.unitPrice.amount,
          totalPrice: i.totalPrice.amount,
        })),
        createdAt: project.createdAt,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /projects/:id/items - Add item to project
  router.post('/projects/:id/items', async (req: Request, res: Response) => {
    try {
      const { materialId, quantity, unitPrice } = req.body;

      const project = await addProjectItem.execute({
        projectId: req.params.id,
        materialId,
        quantity,
        unitPrice,
      });

      res.status(201).json({
        id: project.id,
        itemCount: project.itemCount,
        totalCost: project.totalCost.amount,
        items: project.items.map(i => ({
          id: i.id,
          materialId: i.materialId,
          quantity: i.quantity,
          totalPrice: i.totalPrice.amount,
        })),
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // PATCH /projects/:id/status - Update project status
  router.patch('/projects/:id/status', async (req: Request, res: Response) => {
    try {
      const { status } = req.body;

      const project = await updateProjectStatus.execute({
        projectId: req.params.id,
        newStatus: status as ProjectStatus,
      });

      res.json({
        id: project.id,
        status: project.status,
        endDate: project.endDate,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}
