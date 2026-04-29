"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCategoryRoutes = createCategoryRoutes;
const express_1 = require("express");
const category_entity_1 = require("../../../domains/category/entities/category.entity");
const logger_1 = require("../../../shared/logger");
const VALID_TYPES = ['income', 'expense', 'project', 'material'];
function createCategoryRoutes(categoryRepo) {
    const router = (0, express_1.Router)();
    // GET /categories - List all categories
    router.get('/', async (_req, res) => {
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
        }
        catch (error) {
            logger_1.logger.error('Failed to list categories', { error: error.message });
            res.status(500).json({ error: error.message });
        }
    });
    // GET /categories/:id - Get category details
    router.get('/:id', async (req, res) => {
        try {
            const category = await categoryRepo.findById(req.params.id);
            if (!category) {
                return res.status(404).json({ error: 'Category not found' });
            }
            res.json(category.toSafeObject());
        }
        catch (error) {
            logger_1.logger.error('Failed to get category', { error: error.message, id: req.params.id });
            res.status(500).json({ error: error.message });
        }
    });
    // POST /categories - Create a new category
    router.post('/', async (req, res) => {
        try {
            const { name, type, color, icon } = req.body;
            if (!name || String(name).trim().length === 0) {
                return res.status(400).json({ error: 'Category name is required' });
            }
            const categoryType = String(type ?? 'expense');
            if (!VALID_TYPES.includes(categoryType)) {
                return res.status(400).json({ error: `Invalid category type. Must be one of: ${VALID_TYPES.join(', ')}` });
            }
            const category = category_entity_1.Category.create({
                name: String(name).trim(),
                type: categoryType,
                color: color ? String(color) : '#6366f1',
                icon: icon ? String(icon) : '',
            });
            await categoryRepo.save(category);
            logger_1.logger.info('Category created', { id: category.id, name: category.name, type: category.type });
            res.status(201).json({
                ...category.toSafeObject(),
                count: 0,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to create category', { error: error.message, body: req.body });
            res.status(400).json({ error: error.message });
        }
    });
    // PATCH /categories/:id - Update category
    router.patch('/:id', async (req, res) => {
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
                type: type !== undefined ? String(type) : undefined,
                color: color !== undefined ? String(color) : undefined,
                icon: icon !== undefined ? String(icon) : undefined,
            });
            await categoryRepo.save(category);
            logger_1.logger.info('Category updated', { id: category.id, name: category.name });
            res.json({
                ...category.toSafeObject(),
                count: 0,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to update category', { error: error.message, id: req.params.id });
            res.status(400).json({ error: error.message });
        }
    });
    // DELETE /categories/:id - Delete category
    router.delete('/:id', async (req, res) => {
        try {
            const category = await categoryRepo.findById(req.params.id);
            if (!category) {
                return res.status(404).json({ error: 'Category not found' });
            }
            await categoryRepo.delete(req.params.id);
            logger_1.logger.info('Category deleted', { id: req.params.id });
            res.status(204).send();
        }
        catch (error) {
            logger_1.logger.error('Failed to delete category', { error: error.message, id: req.params.id });
            res.status(500).json({ error: error.message });
        }
    });
    return router;
}
//# sourceMappingURL=category.routes.js.map