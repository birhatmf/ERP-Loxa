import { Request, Response, Router } from 'express';
import { Category } from '@domains/category/entities/category.entity';
import { ICategoryRepository } from '@domains/category/repositories/category.repository';
import { logger } from '@shared/logger';

const VALID_TYPES = ['income', 'expense', 'project', 'material'];

export function createCategoryRoutes(
  categoryRepo: ICategoryRepository
): Router {
  const router = Router();

  // GET /categories - List all categories
  router.get('/', async (_req: Request, res: Response) => {
    try {
      const categories = await categoryRepo.findAll();
      res.json(categories.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        color: c.color,
        icon: c.icon,
        count: 0, // Frontend expects count field
        createdAt: c.createdAt,
      })));
    } catch (error: any) {
      logger.error('Failed to list categories', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // GET /categories/:id - Get category details
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const category = await categoryRepo.findById(req.params.id);
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
      res.json(category.toSafeObject());
    } catch (error: any) {
      logger.error('Failed to get category', { error: error.message, id: req.params.id });
      res.status(500).json({ error: error.message });
    }
  });

  // POST /categories - Create a new category
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { name, type, color, icon } = req.body;

      if (!name || String(name).trim().length === 0) {
        return res.status(400).json({ error: 'Category name is required' });
      }

      const categoryType = String(type ?? 'expense');
      if (!VALID_TYPES.includes(categoryType)) {
        return res.status(400).json({ error: `Invalid category type. Must be one of: ${VALID_TYPES.join(', ')}` });
      }

      const category = Category.create({
        name: String(name).trim(),
        type: categoryType as any,
        color: color ? String(color) : '#6366f1',
        icon: icon ? String(icon) : '',
      });

      await categoryRepo.save(category);

      logger.info('Category created', { id: category.id, name: category.name, type: category.type });
      res.status(201).json({
        ...category.toSafeObject(),
        count: 0,
      });
    } catch (error: any) {
      logger.error('Failed to create category', { error: error.message, body: req.body });
      res.status(400).json({ error: error.message });
    }
  });

  // PATCH /categories/:id - Update category
  router.patch('/:id', async (req: Request, res: Response) => {
    try {
      const category = await categoryRepo.findById(req.params.id);
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      const { name, type, color, icon } = req.body;

      if (type && !VALID_TYPES.includes(String(type))) {
        return res.status(400).json({ error: `Invalid category type. Must be one of: ${VALID_TYPES.join(', ')}` });
      }

      category.updateInfo({
        name: name !== undefined ? String(name).trim() : undefined,
        type: type !== undefined ? String(type) as any : undefined,
        color: color !== undefined ? String(color) : undefined,
        icon: icon !== undefined ? String(icon) : undefined,
      });

      await categoryRepo.save(category);

      logger.info('Category updated', { id: category.id, name: category.name });
      res.json({
        ...category.toSafeObject(),
        count: 0,
      });
    } catch (error: any) {
      logger.error('Failed to update category', { error: error.message, id: req.params.id });
      res.status(400).json({ error: error.message });
    }
  });

  // DELETE /categories/:id - Delete category
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const category = await categoryRepo.findById(req.params.id);
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      await categoryRepo.delete(req.params.id);
      logger.info('Category deleted', { id: req.params.id });
      res.status(204).send();
    } catch (error: any) {
      logger.error('Failed to delete category', { error: error.message, id: req.params.id });
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
