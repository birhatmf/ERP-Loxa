import express, { Request, Response, Router } from 'express';
import { CreateProject, AddProjectItem, UpdateProjectInfo, DeleteProject, UpdateProjectStatus } from '@application/use-cases/project/project.use-cases';
import { IProjectFileRepository, IProjectRepository, CostCalculationService, ProjectStatus } from '@domains/project';
import { logger } from '@shared/logger';
import { generateId } from '@shared/types';
import fs from 'fs';
import path from 'path';

function getProjectFilesDir(): string {
  const dir = path.join(process.cwd(), 'data', 'project-files');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^\w.\-()\s]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^_+|_+$/g, '') || 'file';
}

function parseMultipartFile(body: Buffer, contentType?: string): {
  originalName: string;
  storedName: string;
  mimeType: string;
  buffer: Buffer;
} {
  const boundaryMatch = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType ?? '');
  if (!boundaryMatch) {
    throw new Error('Multipart boundary not found');
  }

  const boundary = `--${boundaryMatch[1] ?? boundaryMatch[2]}`;
  const raw = body.toString('latin1');
  const parts = raw.split(boundary);

  for (const part of parts) {
    const trimmed = part.replace(/^\r\n/, '').replace(/\r\n$/, '');
    if (!trimmed || trimmed === '--') continue;

    const headerEnd = trimmed.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;

    const headerText = trimmed.slice(0, headerEnd);
    const contentText = trimmed.slice(headerEnd + 4).replace(/\r\n$/, '');
    const headers = headerText.split('\r\n');
    const disposition = headers.find(h => h.toLowerCase().startsWith('content-disposition'));

    if (!disposition || !disposition.includes('filename=')) {
      continue;
    }

    const filenameMatch = /filename="([^"]*)"/i.exec(disposition);
    const typeHeader = headers.find(h => h.toLowerCase().startsWith('content-type'));
    const originalName = filenameMatch?.[1] || 'file';

    return {
      originalName,
      storedName: sanitizeFilename(originalName),
      mimeType: typeHeader?.split(':')[1]?.trim() || 'application/octet-stream',
      buffer: Buffer.from(contentText, 'latin1'),
    };
  }

  throw new Error('No file found in multipart payload');
}

export function createProjectRoutes(
  createProject: CreateProject,
  addProjectItem: AddProjectItem,
  updateProjectInfo: UpdateProjectInfo,
  deleteProject: DeleteProject,
  updateProjectStatus: UpdateProjectStatus,
  costService: CostCalculationService,
  projectRepo: IProjectRepository,
  projectFileRepo: IProjectFileRepository
): Router {
  const router = Router();
  const uploadParser = express.raw({ type: 'multipart/form-data', limit: '25mb' });

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

      logger.info('Project created', { id: project.id, name: project.name });
      res.status(201).json({
        id: project.id,
        name: project.name,
        customerName: project.customerName,
        status: project.status,
        totalPrice: project.totalPrice.amount,
        createdAt: project.createdAt,
      });
    } catch (error: any) {
      logger.error('Failed to create project', { error: error.message, body: req.body });
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
        description: p.description,
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

  // PATCH /projects/:id - Update project info
  router.patch('/projects/:id', async (req: Request, res: Response) => {
    try {
      const { name, customerName, description, totalPrice } = req.body;

      const project = await updateProjectInfo.execute({
        projectId: req.params.id,
        name,
        customerName,
        description,
        totalPrice: totalPrice !== undefined ? Number(totalPrice) : undefined,
      });

      logger.info('Project updated', { id: project.id, name: project.name });
      res.json({
        id: project.id,
        name: project.name,
        customerName: project.customerName,
        description: project.description,
        status: project.status,
        totalPrice: project.totalPrice.amount,
        itemCount: project.itemCount,
        totalCost: project.totalCost.amount,
        profitMargin: project.profitMargin.amount,
        profitMarginPercentage: project.totalPrice.isZero()
          ? 0
          : (project.profitMargin.amount / project.totalPrice.amount) * 100,
        createdAt: project.createdAt,
      });
    } catch (error: any) {
      logger.error('Failed to update project', { error: error.message, id: req.params.id, body: req.body });
      res.status(400).json({ error: error.message });
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

  // DELETE /projects/:id - Delete project
  router.delete('/projects/:id', async (req: Request, res: Response) => {
    try {
      await deleteProject.execute(req.params.id);
      logger.info('Project deleted', { id: req.params.id });
      res.status(204).send();
    } catch (error: any) {
      logger.error('Failed to delete project', { error: error.message, id: req.params.id });
      res.status(400).json({ error: error.message });
    }
  });

  // GET /projects/:id/files - List project files
  router.get('/projects/:id/files', async (req: Request, res: Response) => {
    try {
      const project = await projectRepo.findById(req.params.id);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const files = await projectFileRepo.findByProjectId(req.params.id);
      res.json(files.map(file => ({
        id: file.id,
        name: file.originalName,
        size: file.size,
        type: file.mimeType,
        url: `/api/project/projects/${req.params.id}/files/${file.id}`,
        uploadedAt: file.uploadedAt.toISOString(),
      })));
    } catch (error: any) {
      logger.error('Failed to list project files', { error: error.message, id: req.params.id });
      res.status(500).json({ error: error.message });
    }
  });

  // POST /projects/:id/files - Upload project file
  router.post('/projects/:id/files', uploadParser, async (req: Request, res: Response) => {
    try {
      const project = await projectRepo.findById(req.params.id);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const body = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body ?? '');
      const contentType = req.headers['content-type'];
      const file = parseMultipartFile(body, Array.isArray(contentType) ? contentType[0] : contentType);
      const fileId = generateId();
      const storageDir = getProjectFilesDir();
      const storagePath = path.join(storageDir, `${fileId}-${file.storedName}`);

      await fs.promises.writeFile(storagePath, file.buffer);

      const now = new Date();
      await projectFileRepo.save({
        id: fileId,
        projectId: req.params.id,
        name: file.storedName,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.buffer.length,
        storagePath,
        uploadedAt: now,
        createdAt: now,
        updatedAt: now,
      });

      logger.info('Project file uploaded', { projectId: req.params.id, fileId, name: file.originalName, size: file.buffer.length });
      res.status(201).json({
        id: fileId,
        name: file.originalName,
        size: file.buffer.length,
        type: file.mimeType,
        url: `/api/project/projects/${req.params.id}/files/${fileId}`,
        uploadedAt: now.toISOString(),
      });
    } catch (error: any) {
      logger.error('Failed to upload project file', { error: error.message, id: req.params.id });
      res.status(400).json({ error: error.message });
    }
  });

  // GET /projects/:id/files/:fileId - Stream project file
  router.get('/projects/:id/files/:fileId', async (req: Request, res: Response) => {
    try {
      const file = await projectFileRepo.findById(req.params.fileId);
      if (!file || file.projectId !== req.params.id) {
        return res.status(404).json({ error: 'File not found' });
      }

      if (!fs.existsSync(file.storagePath)) {
        return res.status(404).json({ error: 'File content not found' });
      }

      res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${file.originalName.replace(/"/g, '\\"')}"`
      );
      fs.createReadStream(file.storagePath).pipe(res);
    } catch (error: any) {
      logger.error('Failed to open project file', { error: error.message, id: req.params.fileId });
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE /projects/:id/files/:fileId - Remove project file
  router.delete('/projects/:id/files/:fileId', async (req: Request, res: Response) => {
    try {
      const file = await projectFileRepo.findById(req.params.fileId);
      if (!file || file.projectId !== req.params.id) {
        return res.status(404).json({ error: 'File not found' });
      }

      if (fs.existsSync(file.storagePath)) {
        await fs.promises.unlink(file.storagePath);
      }

      await projectFileRepo.delete(file.id);
      logger.info('Project file deleted', { projectId: req.params.id, fileId: file.id });
      res.status(204).send();
    } catch (error: any) {
      logger.error('Failed to delete project file', { error: error.message, id: req.params.fileId });
      res.status(400).json({ error: error.message });
    }
  });

  // PATCH /projects/:id/status - Update project lifecycle status
  router.patch('/projects/:id/status', async (req: Request, res: Response) => {
    try {
      const { status } = req.body;

      const project = await updateProjectStatus.execute({
        projectId: req.params.id,
        newStatus: status as ProjectStatus,
      });

      logger.info('Project status updated', { id: project.id, status: project.status });
      res.json({
        id: project.id,
        status: project.status,
        endDate: project.endDate,
      });
    } catch (error: any) {
      logger.error('Failed to update project status', { error: error.message, id: req.params.id, body: req.body });
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}
