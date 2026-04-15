"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProjectRoutes = createProjectRoutes;
const express_1 = require("express");
const logger_1 = require("@shared/logger");
function createProjectRoutes(createProject, addProjectItem, costService, projectRepo) {
    const router = (0, express_1.Router)();
    // POST /projects - Create a new project
    router.post('/projects', async (req, res) => {
        try {
            const { name, customerName, description, totalPrice } = req.body;
            const project = await createProject.execute({
                name,
                customerName,
                description,
                totalPrice,
            });
            logger_1.logger.info('Project created', { id: project.id, name: project.name });
            res.status(201).json({
                id: project.id,
                name: project.name,
                customerName: project.customerName,
                status: project.status,
                totalPrice: project.totalPrice.amount,
                createdAt: project.createdAt,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to create project', { error: error.message, body: req.body });
            res.status(400).json({ error: error.message });
        }
    });
    // GET /projects - List all projects
    router.get('/projects', async (req, res) => {
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
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    // GET /projects/:id - Get project details
    router.get('/projects/:id', async (req, res) => {
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
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    // POST /projects/:id/items - Add item to project
    router.post('/projects/:id/items', async (req, res) => {
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
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    });
    return router;
}
//# sourceMappingURL=project.routes.js.map