"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Ensure data directory exists
const dataDir = path_1.default.join(process.cwd(), 'data');
if (!fs_1.default.existsSync(dataDir)) {
    fs_1.default.mkdirSync(dataDir, { recursive: true });
}
const types_1 = require("./shared/types");
const knexfile_1 = require("./infrastructure/database/knexfile");
const sqlite_audit_log_repository_1 = require("./infrastructure/database/repositories/sqlite-audit-log.repository");
const sqlite_notification_repository_1 = require("./infrastructure/database/repositories/sqlite-notification.repository");
// Repositories
const sqlite_transaction_repository_1 = require("./infrastructure/database/repositories/sqlite-transaction.repository");
const sqlite_material_repository_1 = require("./infrastructure/database/repositories/sqlite-material.repository");
const sqlite_project_repository_1 = require("./infrastructure/database/repositories/sqlite-project.repository");
const sqlite_project_file_repository_1 = require("./infrastructure/database/repositories/sqlite-project-file.repository");
const sqlite_check_repository_1 = require("./infrastructure/database/repositories/sqlite-check.repository");
const sqlite_check_file_repository_1 = require("./infrastructure/database/repositories/sqlite-check-file.repository");
const sqlite_invoice_repository_1 = require("./infrastructure/database/repositories/sqlite-invoice.repository");
const sqlite_user_repository_1 = require("./infrastructure/database/repositories/sqlite-user.repository");
const sqlite_recurring_transaction_repository_1 = require("./infrastructure/database/repositories/sqlite-recurring-transaction.repository");
const sqlite_supplier_repository_1 = require("./infrastructure/database/repositories/sqlite-supplier.repository");
const sqlite_purchase_order_repository_1 = require("./infrastructure/database/repositories/sqlite-purchase-order.repository");
const sqlite_customer_repository_1 = require("./infrastructure/database/repositories/sqlite-customer.repository");
const sqlite_category_repository_1 = require("./infrastructure/database/repositories/sqlite-category.repository");
const sqlite_budget_repository_1 = require("./infrastructure/database/repositories/sqlite-budget.repository");
const sqlite_sale_repository_1 = require("./infrastructure/database/repositories/sqlite-sale.repository");
const sqlite_payroll_repository_1 = require("./infrastructure/database/repositories/sqlite-payroll.repository");
// Domain Services
const finance_1 = require("./domains/finance");
const inventory_1 = require("./domains/inventory");
const project_1 = require("./domains/project");
const payment_1 = require("./domains/payment");
const invoice_1 = require("./domains/invoice");
const auth_service_1 = require("./domains/auth/services/auth.service");
// Use Cases
const create_transaction_use_case_1 = require("./application/use-cases/finance/create-transaction.use-case");
const project_use_cases_1 = require("./application/use-cases/project/project.use-cases");
const inventory_use_cases_1 = require("./application/use-cases/inventory/inventory.use-cases");
const payment_use_cases_1 = require("./application/use-cases/payment/payment.use-cases");
// Routes
const finance_routes_1 = require("./interfaces/api/routes/finance.routes");
const project_routes_1 = require("./interfaces/api/routes/project.routes");
const inventory_routes_1 = require("./interfaces/api/routes/inventory.routes");
const auth_routes_1 = require("./interfaces/api/routes/auth.routes");
const invoice_routes_1 = require("./interfaces/api/routes/invoice.routes");
const payment_routes_1 = require("./interfaces/api/routes/payment.routes");
const recurring_routes_1 = require("./interfaces/api/routes/recurring.routes");
const notification_routes_1 = require("./interfaces/api/routes/notification.routes");
const procurement_routes_1 = require("./interfaces/api/routes/procurement.routes");
const reports_routes_1 = require("./interfaces/api/routes/reports.routes");
const customer_routes_1 = require("./interfaces/api/routes/customer.routes");
const category_routes_1 = require("./interfaces/api/routes/category.routes");
const budget_routes_1 = require("./interfaces/api/routes/budget.routes");
const sales_routes_1 = require("./interfaces/api/routes/sales.routes");
const payroll_routes_1 = require("./interfaces/api/routes/payroll.routes");
const auth_middleware_1 = require("./interfaces/api/middleware/auth.middleware");
const request_logger_middleware_1 = require("./interfaces/api/middleware/request-logger.middleware");
const audit_service_1 = require("./shared/audit/audit.service");
// Stock movement repository (inline)
const inventory_2 = require("./domains/inventory");
async function bootstrap() {
    const app = (0, express_1.default)();
    const PORT = process.env.PORT || 4051;
    // Middleware
    app.use(express_1.default.json());
    // Database
    const knex = (0, knexfile_1.createConnection)();
    await knex.migrate.latest();
    console.log('✅ Database migrations complete');
    // Event Bus
    const eventBus = new types_1.EventBus();
    // Repositories
    const transactionRepo = new sqlite_transaction_repository_1.SqliteTransactionRepository(knex);
    const materialRepo = new sqlite_material_repository_1.SqliteMaterialRepository(knex);
    const projectRepo = new sqlite_project_repository_1.SqliteProjectRepository(knex);
    const projectFileRepo = new sqlite_project_file_repository_1.SqliteProjectFileRepository(knex);
    const checkRepo = new sqlite_check_repository_1.SqliteCheckRepository(knex);
    const checkFileRepo = new sqlite_check_file_repository_1.SqliteCheckFileRepository(knex);
    const invoiceRepo = new sqlite_invoice_repository_1.SqliteInvoiceRepository(knex);
    const userRepo = new sqlite_user_repository_1.SqliteUserRepository(knex);
    const auditRepo = new sqlite_audit_log_repository_1.SqliteAuditLogRepository(knex);
    const recurringRepo = new sqlite_recurring_transaction_repository_1.SqliteRecurringTransactionRepository(knex);
    const notificationRepo = new sqlite_notification_repository_1.SqliteNotificationRepository(knex);
    const supplierRepo = new sqlite_supplier_repository_1.SqliteSupplierRepository(knex);
    const purchaseOrderRepo = new sqlite_purchase_order_repository_1.SqlitePurchaseOrderRepository(knex);
    const customerRepo = new sqlite_customer_repository_1.SqliteCustomerRepository(knex);
    const categoryRepo = new sqlite_category_repository_1.SqliteCategoryRepository(knex);
    const budgetRepo = new sqlite_budget_repository_1.SqliteBudgetRepository(knex);
    const saleRepo = new sqlite_sale_repository_1.SqliteSaleRepository(knex);
    const payrollRepo = new sqlite_payroll_repository_1.SqlitePayrollRepository(knex);
    // Movement repo (inline implementation)
    const movementRepo = {
        async findById(id) { const r = await knex('stock_movements').where({ id }).first(); return r ? inventory_2.StockMovement.reconstitute({ id: r.id, materialId: r.material_id, type: r.type, quantity: parseFloat(r.quantity), description: r.description, relatedProjectId: r.related_project_id, date: new Date(r.date), isCorrection: Boolean(r.is_correction), correctionReason: r.correction_reason ?? null, correctedAt: r.corrected_at ? new Date(r.corrected_at) : null, createdAt: new Date(r.created_at), updatedAt: new Date(r.updated_at) }) : null; },
        async findAll() { const rows = await knex('stock_movements').orderBy('date', 'desc'); return rows.map((r) => inventory_2.StockMovement.reconstitute({ id: r.id, materialId: r.material_id, type: r.type, quantity: parseFloat(r.quantity), description: r.description, relatedProjectId: r.related_project_id, date: new Date(r.date), isCorrection: Boolean(r.is_correction), correctionReason: r.correction_reason ?? null, correctedAt: r.corrected_at ? new Date(r.corrected_at) : null, createdAt: new Date(r.created_at), updatedAt: new Date(r.updated_at) })); },
        async save(entity) {
            const existing = await knex('stock_movements').where({ id: entity.id }).first();
            const row = { id: entity.id, material_id: entity.materialId, type: entity.type, quantity: entity.quantity, description: entity.description, related_project_id: entity.relatedProjectId ?? null, date: entity.date.toISOString(), is_correction: entity.isCorrection ? 1 : 0, correction_reason: entity.correctionReason ?? null, corrected_at: entity.correctedAt?.toISOString() ?? null, created_at: entity.createdAt.toISOString(), updated_at: entity.updatedAt.toISOString() };
            if (existing) {
                await knex('stock_movements').where({ id: entity.id }).update(row);
            }
            else {
                await knex('stock_movements').insert(row);
            }
        },
        async delete(id) { await knex('stock_movements').where({ id }).delete(); },
        async findByMaterial(materialId) { const rows = await knex('stock_movements').where({ material_id: materialId }).orderBy('date', 'desc'); return rows.map((r) => inventory_2.StockMovement.reconstitute({ id: r.id, materialId: r.material_id, type: r.type, quantity: parseFloat(r.quantity), description: r.description, relatedProjectId: r.related_project_id, date: new Date(r.date), isCorrection: Boolean(r.is_correction), correctionReason: r.correction_reason ?? null, correctedAt: r.corrected_at ? new Date(r.corrected_at) : null, createdAt: new Date(r.created_at), updatedAt: new Date(r.updated_at) })); },
        async findByProject(projectId) { const rows = await knex('stock_movements').where({ related_project_id: projectId }); return rows.map((r) => inventory_2.StockMovement.reconstitute({ id: r.id, materialId: r.material_id, type: r.type, quantity: parseFloat(r.quantity), description: r.description, relatedProjectId: r.related_project_id, date: new Date(r.date), isCorrection: Boolean(r.is_correction), correctionReason: r.correction_reason ?? null, correctedAt: r.corrected_at ? new Date(r.corrected_at) : null, createdAt: new Date(r.created_at), updatedAt: new Date(r.updated_at) })); },
        async findByType(type) { const rows = await knex('stock_movements').where({ type }); return rows.map((r) => inventory_2.StockMovement.reconstitute({ id: r.id, materialId: r.material_id, type: r.type, quantity: parseFloat(r.quantity), description: r.description, relatedProjectId: r.related_project_id, date: new Date(r.date), isCorrection: Boolean(r.is_correction), correctionReason: r.correction_reason ?? null, correctedAt: r.corrected_at ? new Date(r.corrected_at) : null, createdAt: new Date(r.created_at), updatedAt: new Date(r.updated_at) })); },
        async findByDateRange(from, to) { const rows = await knex('stock_movements').whereBetween('date', [from.toISOString(), to.toISOString()]); return rows.map((r) => inventory_2.StockMovement.reconstitute({ id: r.id, materialId: r.material_id, type: r.type, quantity: parseFloat(r.quantity), description: r.description, relatedProjectId: r.related_project_id, date: new Date(r.date), isCorrection: Boolean(r.is_correction), correctionReason: r.correction_reason ?? null, correctedAt: r.corrected_at ? new Date(r.corrected_at) : null, createdAt: new Date(r.created_at), updatedAt: new Date(r.updated_at) })); },
    };
    // Domain Services
    const cashService = new finance_1.CashService();
    const auditService = new audit_service_1.AuditService(auditRepo);
    const stockService = new inventory_1.StockService(materialRepo, movementRepo, eventBus);
    const costService = new project_1.CostCalculationService(eventBus, auditService);
    const checkService = new payment_1.CheckService(checkRepo, eventBus, auditService);
    const invoiceService = new invoice_1.InvoiceService(invoiceRepo, eventBus);
    const authService = new auth_service_1.AuthService(userRepo);
    // Use Cases
    const createTransaction = new create_transaction_use_case_1.CreateTransaction(transactionRepo, eventBus);
    const updateTransaction = new create_transaction_use_case_1.UpdateTransaction(transactionRepo, eventBus);
    const cancelTransaction = new create_transaction_use_case_1.CancelTransaction(transactionRepo, eventBus);
    const createProject = new project_use_cases_1.CreateProject(projectRepo, eventBus);
    const addProjectItem = new project_use_cases_1.AddProjectItem(projectRepo, stockService, eventBus);
    const updateProjectInfo = new project_use_cases_1.UpdateProjectInfo(projectRepo, eventBus);
    const deleteProject = new project_use_cases_1.DeleteProject(projectRepo, projectFileRepo);
    const updateProjectStatus = new project_use_cases_1.UpdateProjectStatus(projectRepo, eventBus);
    const createMaterial = new inventory_use_cases_1.CreateMaterial(materialRepo, eventBus);
    const addStock = new inventory_use_cases_1.AddStock(stockService, eventBus);
    // Auth middleware
    const auth = (0, auth_middleware_1.authMiddleware)(authService);
    const requestLogger = (0, request_logger_middleware_1.createRequestLogger)(auditService);
    eventBus.register('LowStockWarning', {
        handle: async (event) => {
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
    app.use('/api/auth', (0, auth_routes_1.createAuthRoutes)(authService));
    // Protected API routes
    app.use('/api/finance', auth, auth_middleware_1.adminOnly, (0, finance_routes_1.createFinanceRoutes)(createTransaction, updateTransaction, cancelTransaction, cashService, transactionRepo));
    app.use('/api/finance/recurring', auth, auth_middleware_1.adminOnly, (0, recurring_routes_1.createRecurringRoutes)(recurringRepo, createTransaction));
    app.use('/api/project', auth, auth_middleware_1.adminOnly, (0, project_routes_1.createProjectRoutes)(createProject, addProjectItem, updateProjectInfo, deleteProject, updateProjectStatus, costService, projectRepo, projectFileRepo, saleRepo));
    app.use('/api/inventory', auth, auth_middleware_1.adminOnly, (0, inventory_routes_1.createInventoryRoutes)(createMaterial, addStock, stockService, materialRepo, purchaseOrderRepo, movementRepo));
    app.use('/api/invoices', auth, auth_middleware_1.adminOnly, (0, invoice_routes_1.createInvoiceRoutes)(invoiceRepo, invoiceService, eventBus));
    app.use('/api/payment', auth, auth_middleware_1.adminOnly, (0, payment_routes_1.createPaymentRoutes)(new payment_use_cases_1.CreateCheck(checkRepo, eventBus), new payment_use_cases_1.PayCheck(checkRepo, transactionRepo, eventBus), checkRepo, checkFileRepo, transactionRepo, eventBus));
    app.use('/api/notifications', auth, auth_middleware_1.adminOnly, (0, notification_routes_1.createNotificationRoutes)(notificationRepo));
    app.use('/api/customers', auth, auth_middleware_1.adminOnly, (0, customer_routes_1.createCustomerRoutes)(customerRepo));
    app.use('/api/categories', auth, auth_middleware_1.adminOnly, (0, category_routes_1.createCategoryRoutes)(categoryRepo));
    app.use('/api/budget', auth, auth_middleware_1.adminOnly, (0, budget_routes_1.createBudgetRoutes)(budgetRepo));
    app.use('/api/payroll', auth, auth_middleware_1.adminOnly, (0, payroll_routes_1.createPayrollRoutes)(payrollRepo));
    app.use('/api/sales', auth, auth_middleware_1.adminOnly, (0, sales_routes_1.createSalesRoutes)(saleRepo, transactionRepo, projectRepo));
    app.use('/api', auth, auth_middleware_1.adminOnly, (0, procurement_routes_1.createProcurementRoutes)(supplierRepo, purchaseOrderRepo, materialRepo, stockService));
    app.use('/api', auth, auth_middleware_1.adminOnly, (0, reports_routes_1.createReportsRoutes)(transactionRepo, projectRepo, invoiceRepo, materialRepo));
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
//# sourceMappingURL=index.js.map