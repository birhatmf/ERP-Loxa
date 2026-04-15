import express from 'express';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

import { EventBus } from '@shared/types';
import { createConnection } from '@infrastructure/database/knexfile';
import { SqliteAuditLogRepository } from '@infrastructure/database/repositories/sqlite-audit-log.repository';

// Repositories
import { SqliteTransactionRepository } from '@infrastructure/database/repositories/sqlite-transaction.repository';
import { SqliteMaterialRepository } from '@infrastructure/database/repositories/sqlite-material.repository';
import { SqliteProjectRepository } from '@infrastructure/database/repositories/sqlite-project.repository';
import { SqliteCheckRepository } from '@infrastructure/database/repositories/sqlite-check.repository';
import { SqliteInvoiceRepository } from '@infrastructure/database/repositories/sqlite-invoice.repository';
import { SqliteUserRepository } from '@infrastructure/database/repositories/sqlite-user.repository';
import { SqliteRecurringTransactionRepository } from '@infrastructure/database/repositories/sqlite-recurring-transaction.repository';

// Domain Services
import { CashService } from '@domains/finance';
import { StockService } from '@domains/inventory';
import { CostCalculationService } from '@domains/project';
import { CheckService } from '@domains/payment';
import { InvoiceService } from '@domains/invoice';
import { AuthService } from '@domains/auth/services/auth.service';

// Use Cases
import { CreateTransaction } from '@application/use-cases/finance/create-transaction.use-case';
import { CreateProject, AddProjectItem } from '@application/use-cases/project/project.use-cases';
import { CreateMaterial, AddStock } from '@application/use-cases/inventory/inventory.use-cases';

// Routes
import { createFinanceRoutes } from '@interfaces/api/routes/finance.routes';
import { createProjectRoutes } from '@interfaces/api/routes/project.routes';
import { createInventoryRoutes } from '@interfaces/api/routes/inventory.routes';
import { createAuthRoutes } from '@interfaces/api/routes/auth.routes';
import { createInvoiceRoutes } from '@interfaces/api/routes/invoice.routes';
import { createRecurringRoutes } from '@interfaces/api/routes/recurring.routes';
import { authMiddleware } from '@interfaces/api/middleware/auth.middleware';
import { createRequestLogger } from '@interfaces/api/middleware/request-logger.middleware';
import { AuditService } from '@shared/audit/audit.service';

// Stock movement repository (inline)
import { StockMovement, StockMovementType } from '@domains/inventory';

async function bootstrap() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Middleware
  app.use(express.json());

  // Database
  const knex = createConnection();
  await knex.migrate.latest();
  console.log('✅ Database migrations complete');

  // Event Bus
  const eventBus = new EventBus();

  // Repositories
  const transactionRepo = new SqliteTransactionRepository(knex);
  const materialRepo = new SqliteMaterialRepository(knex);
  const projectRepo = new SqliteProjectRepository(knex);
  const checkRepo = new SqliteCheckRepository(knex);
  const invoiceRepo = new SqliteInvoiceRepository(knex);
  const userRepo = new SqliteUserRepository(knex);
  const auditRepo = new SqliteAuditLogRepository(knex);
  const recurringRepo = new SqliteRecurringTransactionRepository(knex);

  // Movement repo (inline implementation)
  const movementRepo = {
    async findById(id: string) { const r = await knex('stock_movements').where({ id }).first(); return r ? StockMovement.reconstitute({ ...r, materialId: r.material_id, type: r.type, quantity: parseFloat(r.quantity), date: new Date(r.date), createdAt: new Date(r.created_at), updatedAt: new Date(r.updated_at) }) : null; },
    async findAll() { const rows = await knex('stock_movements').orderBy('date', 'desc'); return rows.map((r: any) => StockMovement.reconstitute({ ...r, materialId: r.material_id, type: r.type, quantity: parseFloat(r.quantity), date: new Date(r.date), createdAt: new Date(r.created_at), updatedAt: new Date(r.updated_at) })); },
    async save(entity: any) {
      const existing = await knex('stock_movements').where({ id: entity.id }).first();
      const row = { id: entity.id, material_id: entity.materialId, type: entity.type, quantity: entity.quantity, description: entity.description, related_project_id: entity.relatedProjectId ?? null, date: entity.date.toISOString(), created_at: entity.createdAt.toISOString(), updated_at: entity.updatedAt.toISOString() };
      if (existing) { await knex('stock_movements').where({ id: entity.id }).update(row); } else { await knex('stock_movements').insert(row); }
    },
    async delete(id: string) { await knex('stock_movements').where({ id }).delete(); },
    async findByMaterial(materialId: string) { const rows = await knex('stock_movements').where({ material_id: materialId }).orderBy('date', 'desc'); return rows.map((r: any) => StockMovement.reconstitute({ ...r, materialId: r.material_id, type: r.type, quantity: parseFloat(r.quantity), date: new Date(r.date), createdAt: new Date(r.created_at), updatedAt: new Date(r.updated_at) })); },
    async findByProject(projectId: string) { const rows = await knex('stock_movements').where({ related_project_id: projectId }); return rows.map((r: any) => StockMovement.reconstitute({ ...r, materialId: r.material_id, type: r.type, quantity: parseFloat(r.quantity), date: new Date(r.date), createdAt: new Date(r.created_at), updatedAt: new Date(r.updated_at) })); },
    async findByType(type: StockMovementType) { const rows = await knex('stock_movements').where({ type }); return rows.map((r: any) => StockMovement.reconstitute({ ...r, materialId: r.material_id, type: r.type, quantity: parseFloat(r.quantity), date: new Date(r.date), createdAt: new Date(r.created_at), updatedAt: new Date(r.updated_at) })); },
    async findByDateRange(from: Date, to: Date) { const rows = await knex('stock_movements').whereBetween('date', [from.toISOString(), to.toISOString()]); return rows.map((r: any) => StockMovement.reconstitute({ ...r, materialId: r.material_id, type: r.type, quantity: parseFloat(r.quantity), date: new Date(r.date), createdAt: new Date(r.created_at), updatedAt: new Date(r.updated_at) })); },
  };

  // Domain Services
  const cashService = new CashService();
  const auditService = new AuditService(auditRepo);
  const stockService = new StockService(materialRepo, movementRepo as any, eventBus);
  const costService = new CostCalculationService(eventBus, auditService);
  const checkService = new CheckService(checkRepo, eventBus, auditService);
  const invoiceService = new InvoiceService(invoiceRepo, eventBus);
  const authService = new AuthService(userRepo);

  // Use Cases
  const createTransaction = new CreateTransaction(transactionRepo, eventBus);
  const createProject = new CreateProject(projectRepo, eventBus);
  const addProjectItem = new AddProjectItem(projectRepo, stockService, eventBus);
  const createMaterial = new CreateMaterial(materialRepo, eventBus);
  const addStock = new AddStock(stockService, eventBus);

  // Auth middleware
  const auth = authMiddleware(authService);
  const requestLogger = createRequestLogger(auditService);

  // === ROUTES ===

  // Request logging
  app.use(requestLogger);

  // Auth (public)
  app.use('/api/auth', createAuthRoutes(authService));

  // Protected API routes
  app.use('/api/finance', auth, createFinanceRoutes(createTransaction, cashService, transactionRepo));
  app.use('/api/finance/recurring', createRecurringRoutes(recurringRepo, createTransaction));
  app.use('/api/project', auth, createProjectRoutes(createProject, addProjectItem, costService, projectRepo));
  app.use('/api/inventory', auth, createInventoryRoutes(createMaterial, addStock, stockService, materialRepo));
  app.use('/api/invoices', auth, createInvoiceRoutes(invoiceRepo, invoiceService, eventBus));

  // Health check (public)
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Start server
  app.listen(PORT, () => {
    console.log(`🚀 ERP Core server running on http://localhost:${PORT}`);
    console.log(`📋 API endpoints:`);
    console.log(`   PUBLIC:`);
    console.log(`     GET  /health`);
    console.log(`     POST /api/auth/register`);
    console.log(`     POST /api/auth/login`);
    console.log(`   PROTECTED (require Bearer token):`);
    console.log(`     GET  /api/auth/me`);
    console.log(`     POST /api/finance/transactions`);
    console.log(`     GET  /api/finance/transactions`);
    console.log(`     GET  /api/finance/cash/balance`);
    console.log(`     POST /api/project/projects`);
    console.log(`     GET  /api/project/projects`);
    console.log(`     GET  /api/project/projects/:id`);
    console.log(`     POST /api/project/projects/:id/items`);
    console.log(`     PATCH /api/project/projects/:id/status`);
    console.log(`     POST /api/inventory/materials`);
    console.log(`     GET  /api/inventory/materials`);
    console.log(`     GET  /api/inventory/materials/low-stock`);
    console.log(`     POST /api/inventory/materials/:id/stock`);
    console.log(`     GET  /api/inventory/materials/:id/history`);
    console.log(`     POST /api/invoices`);
    console.log(`     GET  /api/invoices`);
    console.log(`     GET  /api/invoices/:id`);
    console.log(`     PATCH /api/invoices/:id/send`);
    console.log(`     PATCH /api/invoices/:id/pay`);
  });
}

bootstrap().catch(console.error);
