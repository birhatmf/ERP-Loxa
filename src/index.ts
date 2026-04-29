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
import { SqliteNotificationRepository } from '@infrastructure/database/repositories/sqlite-notification.repository';

// Repositories
import { SqliteTransactionRepository } from '@infrastructure/database/repositories/sqlite-transaction.repository';
import { SqliteMaterialRepository } from '@infrastructure/database/repositories/sqlite-material.repository';
import { SqliteProjectRepository } from '@infrastructure/database/repositories/sqlite-project.repository';
import { SqliteProjectFileRepository } from '@infrastructure/database/repositories/sqlite-project-file.repository';
import { SqliteCheckRepository } from '@infrastructure/database/repositories/sqlite-check.repository';
import { SqliteCheckFileRepository } from '@infrastructure/database/repositories/sqlite-check-file.repository';
import { SqliteInvoiceRepository } from '@infrastructure/database/repositories/sqlite-invoice.repository';
import { SqliteUserRepository } from '@infrastructure/database/repositories/sqlite-user.repository';
import { SqliteRecurringTransactionRepository } from '@infrastructure/database/repositories/sqlite-recurring-transaction.repository';
import { SqliteSupplierRepository } from '@infrastructure/database/repositories/sqlite-supplier.repository';
import { SqlitePurchaseOrderRepository } from '@infrastructure/database/repositories/sqlite-purchase-order.repository';
import { SqliteCustomerRepository } from '@infrastructure/database/repositories/sqlite-customer.repository';
import { SqliteCategoryRepository } from '@infrastructure/database/repositories/sqlite-category.repository';
import { SqliteBudgetRepository } from '@infrastructure/database/repositories/sqlite-budget.repository';
import { SqliteSaleRepository } from '@infrastructure/database/repositories/sqlite-sale.repository';

// Domain Services
import { CashService } from '@domains/finance';
import { StockService } from '@domains/inventory';
import { CostCalculationService } from '@domains/project';
import { CheckService } from '@domains/payment';
import { InvoiceService } from '@domains/invoice';
import { AuthService } from '@domains/auth/services/auth.service';

// Use Cases
import { CreateTransaction, UpdateTransaction, CancelTransaction } from '@application/use-cases/finance/create-transaction.use-case';
import { CreateProject, AddProjectItem, UpdateProjectInfo, DeleteProject, UpdateProjectStatus } from '@application/use-cases/project/project.use-cases';
import { CreateMaterial, AddStock } from '@application/use-cases/inventory/inventory.use-cases';
import { CreateCheck, PayCheck } from '@application/use-cases/payment/payment.use-cases';

// Routes
import { createFinanceRoutes } from '@interfaces/api/routes/finance.routes';
import { createProjectRoutes } from '@interfaces/api/routes/project.routes';
import { createInventoryRoutes } from '@interfaces/api/routes/inventory.routes';
import { createAuthRoutes } from '@interfaces/api/routes/auth.routes';
import { createInvoiceRoutes } from '@interfaces/api/routes/invoice.routes';
import { createPaymentRoutes } from '@interfaces/api/routes/payment.routes';
import { createRecurringRoutes } from '@interfaces/api/routes/recurring.routes';
import { createNotificationRoutes } from '@interfaces/api/routes/notification.routes';
import { createProcurementRoutes } from '@interfaces/api/routes/procurement.routes';
import { createReportsRoutes } from '@interfaces/api/routes/reports.routes';
import { createCustomerRoutes } from '@interfaces/api/routes/customer.routes';
import { createCategoryRoutes } from '@interfaces/api/routes/category.routes';
import { createBudgetRoutes } from '@interfaces/api/routes/budget.routes';
import { createSalesRoutes } from '@interfaces/api/routes/sales.routes';
import { adminOnly, authMiddleware } from '@interfaces/api/middleware/auth.middleware';
import { createRequestLogger } from '@interfaces/api/middleware/request-logger.middleware';
import { AuditService } from '@shared/audit/audit.service';
import { LowStockWarningEvent } from '@domains/inventory';

// Stock movement repository (inline)
import { StockMovement, StockMovementType } from '@domains/inventory';

async function bootstrap() {
  const app = express();
  const PORT = process.env.PORT || 4051;

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
  const projectFileRepo = new SqliteProjectFileRepository(knex);
  const checkRepo = new SqliteCheckRepository(knex);
  const checkFileRepo = new SqliteCheckFileRepository(knex);
  const invoiceRepo = new SqliteInvoiceRepository(knex);
  const userRepo = new SqliteUserRepository(knex);
  const auditRepo = new SqliteAuditLogRepository(knex);
  const recurringRepo = new SqliteRecurringTransactionRepository(knex);
  const notificationRepo = new SqliteNotificationRepository(knex);
  const supplierRepo = new SqliteSupplierRepository(knex);
  const purchaseOrderRepo = new SqlitePurchaseOrderRepository(knex);
  const customerRepo = new SqliteCustomerRepository(knex);
  const categoryRepo = new SqliteCategoryRepository(knex);
  const budgetRepo = new SqliteBudgetRepository(knex);
  const saleRepo = new SqliteSaleRepository(knex);

  // Movement repo (inline implementation)
  const movementRepo = {
    async findById(id: string) { const r = await knex('stock_movements').where({ id }).first(); return r ? StockMovement.reconstitute({ id: r.id, materialId: r.material_id, type: r.type, quantity: parseFloat(r.quantity), description: r.description, relatedProjectId: r.related_project_id, date: new Date(r.date), isCorrection: Boolean(r.is_correction), correctionReason: r.correction_reason ?? null, correctedAt: r.corrected_at ? new Date(r.corrected_at) : null, createdAt: new Date(r.created_at), updatedAt: new Date(r.updated_at) }) : null; },
    async findAll() { const rows = await knex('stock_movements').orderBy('date', 'desc'); return rows.map((r: any) => StockMovement.reconstitute({ id: r.id, materialId: r.material_id, type: r.type, quantity: parseFloat(r.quantity), description: r.description, relatedProjectId: r.related_project_id, date: new Date(r.date), isCorrection: Boolean(r.is_correction), correctionReason: r.correction_reason ?? null, correctedAt: r.corrected_at ? new Date(r.corrected_at) : null, createdAt: new Date(r.created_at), updatedAt: new Date(r.updated_at) })); },
    async save(entity: any) {
      const existing = await knex('stock_movements').where({ id: entity.id }).first();
      const row = { id: entity.id, material_id: entity.materialId, type: entity.type, quantity: entity.quantity, description: entity.description, related_project_id: entity.relatedProjectId ?? null, date: entity.date.toISOString(), is_correction: entity.isCorrection ? 1 : 0, correction_reason: entity.correctionReason ?? null, corrected_at: entity.correctedAt?.toISOString() ?? null, created_at: entity.createdAt.toISOString(), updated_at: entity.updatedAt.toISOString() };
      if (existing) { await knex('stock_movements').where({ id: entity.id }).update(row); } else { await knex('stock_movements').insert(row); }
    },
    async delete(id: string) { await knex('stock_movements').where({ id }).delete(); },
    async findByMaterial(materialId: string) { const rows = await knex('stock_movements').where({ material_id: materialId }).orderBy('date', 'desc'); return rows.map((r: any) => StockMovement.reconstitute({ id: r.id, materialId: r.material_id, type: r.type, quantity: parseFloat(r.quantity), description: r.description, relatedProjectId: r.related_project_id, date: new Date(r.date), isCorrection: Boolean(r.is_correction), correctionReason: r.correction_reason ?? null, correctedAt: r.corrected_at ? new Date(r.corrected_at) : null, createdAt: new Date(r.created_at), updatedAt: new Date(r.updated_at) })); },
    async findByProject(projectId: string) { const rows = await knex('stock_movements').where({ related_project_id: projectId }); return rows.map((r: any) => StockMovement.reconstitute({ id: r.id, materialId: r.material_id, type: r.type, quantity: parseFloat(r.quantity), description: r.description, relatedProjectId: r.related_project_id, date: new Date(r.date), isCorrection: Boolean(r.is_correction), correctionReason: r.correction_reason ?? null, correctedAt: r.corrected_at ? new Date(r.corrected_at) : null, createdAt: new Date(r.created_at), updatedAt: new Date(r.updated_at) })); },
    async findByType(type: StockMovementType) { const rows = await knex('stock_movements').where({ type }); return rows.map((r: any) => StockMovement.reconstitute({ id: r.id, materialId: r.material_id, type: r.type, quantity: parseFloat(r.quantity), description: r.description, relatedProjectId: r.related_project_id, date: new Date(r.date), isCorrection: Boolean(r.is_correction), correctionReason: r.correction_reason ?? null, correctedAt: r.corrected_at ? new Date(r.corrected_at) : null, createdAt: new Date(r.created_at), updatedAt: new Date(r.updated_at) })); },
    async findByDateRange(from: Date, to: Date) { const rows = await knex('stock_movements').whereBetween('date', [from.toISOString(), to.toISOString()]); return rows.map((r: any) => StockMovement.reconstitute({ id: r.id, materialId: r.material_id, type: r.type, quantity: parseFloat(r.quantity), description: r.description, relatedProjectId: r.related_project_id, date: new Date(r.date), isCorrection: Boolean(r.is_correction), correctionReason: r.correction_reason ?? null, correctedAt: r.corrected_at ? new Date(r.corrected_at) : null, createdAt: new Date(r.created_at), updatedAt: new Date(r.updated_at) })); },
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
  const updateTransaction = new UpdateTransaction(transactionRepo, eventBus);
  const cancelTransaction = new CancelTransaction(transactionRepo, eventBus);
  const createProject = new CreateProject(projectRepo, eventBus);
  const addProjectItem = new AddProjectItem(projectRepo, stockService, eventBus);
  const updateProjectInfo = new UpdateProjectInfo(projectRepo, eventBus);
  const deleteProject = new DeleteProject(projectRepo, projectFileRepo);
  const updateProjectStatus = new UpdateProjectStatus(projectRepo, eventBus);
  const createMaterial = new CreateMaterial(materialRepo, eventBus);
  const addStock = new AddStock(stockService, eventBus);

  // Auth middleware
  const auth = authMiddleware(authService);
  const requestLogger = createRequestLogger(auditService);

  eventBus.register('LowStockWarning', {
    handle: async (event: LowStockWarningEvent) => {
      await notificationRepo.save({
        id: `low-stock-${event.aggregateId}`,
        type: 'low_stock',
        title: 'Kritik Stok Uyarısı',
        message: `${event.materialName} stoğu ${event.currentStock} seviyesine düştü. Minimum seviye: ${event.minStockLevel}.`,
        entityId: event.aggregateId,
        entityType: 'material',
        read: false,
        createdAt: event.occurredOn,
        updatedAt: event.occurredOn,
      });
    },
  });

  // === ROUTES ===

  // Request logging
  app.use(requestLogger);

  // Auth (public)
  app.use('/api/auth', createAuthRoutes(authService));

  // Protected API routes
  app.use('/api/finance', auth, adminOnly, createFinanceRoutes(createTransaction, updateTransaction, cancelTransaction, cashService, transactionRepo));
  app.use('/api/finance/recurring', auth, adminOnly, createRecurringRoutes(recurringRepo, createTransaction));
  app.use('/api/project', auth, adminOnly, createProjectRoutes(createProject, addProjectItem, updateProjectInfo, deleteProject, updateProjectStatus, costService, projectRepo, projectFileRepo, saleRepo));
  app.use('/api/inventory', auth, adminOnly, createInventoryRoutes(createMaterial, addStock, stockService, materialRepo, purchaseOrderRepo, movementRepo as any));
  app.use('/api/invoices', auth, adminOnly, createInvoiceRoutes(invoiceRepo, invoiceService, eventBus));
  app.use('/api/payment', auth, adminOnly, createPaymentRoutes(
    new CreateCheck(checkRepo, eventBus),
    new PayCheck(checkRepo, transactionRepo, eventBus),
    checkRepo,
    checkFileRepo,
    transactionRepo,
    eventBus
  ));
  app.use('/api/notifications', auth, adminOnly, createNotificationRoutes(notificationRepo));
  app.use('/api/customers', auth, adminOnly, createCustomerRoutes(customerRepo));
  app.use('/api/categories', auth, adminOnly, createCategoryRoutes(categoryRepo));
  app.use('/api/budget', auth, adminOnly, createBudgetRoutes(budgetRepo));
  app.use('/api/sales', auth, adminOnly, createSalesRoutes(saleRepo, transactionRepo, projectRepo));
  app.use('/api', auth, adminOnly, createProcurementRoutes(supplierRepo, purchaseOrderRepo, materialRepo, stockService));
  app.use('/api', auth, adminOnly, createReportsRoutes(transactionRepo, projectRepo, invoiceRepo, materialRepo));

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
    console.log(`     GET  /api/project/projects/:id/files`);
    console.log(`     POST /api/project/projects/:id/files`);
    console.log(`     GET  /api/project/projects/:id/files/:fileId`);
    console.log(`     DELETE /api/project/projects/:id/files/:fileId`);
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
    console.log(`     GET  /api/payment/checks`);
    console.log(`     POST /api/payment/checks`);
    console.log(`     PATCH /api/payment/checks/:id/status`);
    console.log(`     GET  /api/payment/checks/:id/files`);
    console.log(`     POST /api/payment/checks/:id/files`);
    console.log(`     GET  /api/payment/checks/:id/files/:fileId`);
    console.log(`     DELETE /api/payment/checks/:id/files/:fileId`);
    console.log(`     GET  /api/suppliers`);
    console.log(`     POST /api/suppliers`);
    console.log(`     GET  /api/purchase-orders`);
    console.log(`     POST /api/purchase-orders`);
    console.log(`     PATCH /api/purchase-orders/:id`);
    console.log(`     PATCH /api/purchase-orders/:id/status`);
    console.log(`     DELETE /api/purchase-orders/:id`);
    console.log(`     GET  /api/reports/summary`);
  });
}

bootstrap().catch(console.error);
