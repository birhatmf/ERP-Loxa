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
const types_1 = require("@shared/types");
const knexfile_1 = require("@infrastructure/database/knexfile");
const sqlite_audit_log_repository_1 = require("@infrastructure/database/repositories/sqlite-audit-log.repository");
// Repositories
const sqlite_transaction_repository_1 = require("@infrastructure/database/repositories/sqlite-transaction.repository");
const sqlite_material_repository_1 = require("@infrastructure/database/repositories/sqlite-material.repository");
const sqlite_project_repository_1 = require("@infrastructure/database/repositories/sqlite-project.repository");
const sqlite_check_repository_1 = require("@infrastructure/database/repositories/sqlite-check.repository");
const sqlite_invoice_repository_1 = require("@infrastructure/database/repositories/sqlite-invoice.repository");
const sqlite_user_repository_1 = require("@infrastructure/database/repositories/sqlite-user.repository");
const sqlite_recurring_transaction_repository_1 = require("@infrastructure/database/repositories/sqlite-recurring-transaction.repository");
// Domain Services
const finance_1 = require("@domains/finance");
const inventory_1 = require("@domains/inventory");
const project_1 = require("@domains/project");
const payment_1 = require("@domains/payment");
const invoice_1 = require("@domains/invoice");
const auth_service_1 = require("@domains/auth/services/auth.service");
// Use Cases
const create_transaction_use_case_1 = require("@application/use-cases/finance/create-transaction.use-case");
const project_use_cases_1 = require("@application/use-cases/project/project.use-cases");
const inventory_use_cases_1 = require("@application/use-cases/inventory/inventory.use-cases");
// Routes
const finance_routes_1 = require("@interfaces/api/routes/finance.routes");
const project_routes_1 = require("@interfaces/api/routes/project.routes");
const inventory_routes_1 = require("@interfaces/api/routes/inventory.routes");
const auth_routes_1 = require("@interfaces/api/routes/auth.routes");
const invoice_routes_1 = require("@interfaces/api/routes/invoice.routes");
const recurring_routes_1 = require("@interfaces/api/routes/recurring.routes");
const auth_middleware_1 = require("@interfaces/api/middleware/auth.middleware");
const request_logger_middleware_1 = require("@interfaces/api/middleware/request-logger.middleware");
const audit_service_1 = require("@shared/audit/audit.service");
// Stock movement repository (inline)
const inventory_2 = require("@domains/inventory");
async function bootstrap() {
    const app = (0, express_1.default)();
    const PORT = process.env.PORT || 3000;
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
    const checkRepo = new sqlite_check_repository_1.SqliteCheckRepository(knex);
    const invoiceRepo = new sqlite_invoice_repository_1.SqliteInvoiceRepository(knex);
    const userRepo = new sqlite_user_repository_1.SqliteUserRepository(knex);
    const auditRepo = new sqlite_audit_log_repository_1.SqliteAuditLogRepository(knex);
    const recurringRepo = new sqlite_recurring_transaction_repository_1.SqliteRecurringTransactionRepository(knex);
    // Movement repo (inline implementation)
    const movementRepo = {
        async findById(id) { const r = await knex('stock_movements').where({ id }).first(); return r ? inventory_2.StockMovement.reconstitute({ ...r, materialId: r.material_id, type: r.type, quantity: parseFloat(r.quantity), date: new Date(r.date), createdAt: new Date(r.created_at), updatedAt: new Date(r.updated_at) }) : null; },
        async findAll() { const rows = await knex('stock_movements').orderBy('date', 'desc'); return rows.map((r) => inventory_2.StockMovement.reconstitute({ ...r, materialId: r.material_id, type: r.type, quantity: parseFloat(r.quantity), date: new Date(r.date), createdAt: new Date(r.created_at), updatedAt: new Date(r.updated_at) })); },
        async save(entity) {
            const existing = await knex('stock_movements').where({ id: entity.id }).first();
            const row = { id: entity.id, material_id: entity.materialId, type: entity.type, quantity: entity.quantity, description: entity.description, related_project_id: entity.relatedProjectId ?? null, date: entity.date.toISOString(), created_at: entity.createdAt.toISOString(), updated_at: entity.updatedAt.toISOString() };
            if (existing) {
                await knex('stock_movements').where({ id: entity.id }).update(row);
            }
            else {
                await knex('stock_movements').insert(row);
            }
        },
        async delete(id) { await knex('stock_movements').where({ id }).delete(); },
        async findByMaterial(materialId) { const rows = await knex('stock_movements').where({ material_id: materialId }).orderBy('date', 'desc'); return rows.map((r) => inventory_2.StockMovement.reconstitute({ ...r, materialId: r.material_id, type: r.type, quantity: parseFloat(r.quantity), date: new Date(r.date), createdAt: new Date(r.created_at), updatedAt: new Date(r.updated_at) })); },
        async findByProject(projectId) { const rows = await knex('stock_movements').where({ related_project_id: projectId }); return rows.map((r) => inventory_2.StockMovement.reconstitute({ ...r, materialId: r.material_id, type: r.type, quantity: parseFloat(r.quantity), date: new Date(r.date), createdAt: new Date(r.created_at), updatedAt: new Date(r.updated_at) })); },
        async findByType(type) { const rows = await knex('stock_movements').where({ type }); return rows.map((r) => inventory_2.StockMovement.reconstitute({ ...r, materialId: r.material_id, type: r.type, quantity: parseFloat(r.quantity), date: new Date(r.date), createdAt: new Date(r.created_at), updatedAt: new Date(r.updated_at) })); },
        async findByDateRange(from, to) { const rows = await knex('stock_movements').whereBetween('date', [from.toISOString(), to.toISOString()]); return rows.map((r) => inventory_2.StockMovement.reconstitute({ ...r, materialId: r.material_id, type: r.type, quantity: parseFloat(r.quantity), date: new Date(r.date), createdAt: new Date(r.created_at), updatedAt: new Date(r.updated_at) })); },
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
    const createProject = new project_use_cases_1.CreateProject(projectRepo, eventBus);
    const addProjectItem = new project_use_cases_1.AddProjectItem(projectRepo, stockService, eventBus);
    const createMaterial = new inventory_use_cases_1.CreateMaterial(materialRepo, eventBus);
    const addStock = new inventory_use_cases_1.AddStock(stockService, eventBus);
    // Auth middleware
    const auth = (0, auth_middleware_1.authMiddleware)(authService);
    const requestLogger = (0, request_logger_middleware_1.createRequestLogger)(auditService);
    // === ROUTES ===
    // Request logging
    app.use(requestLogger);
    // Auth (public)
    app.use('/api/auth', (0, auth_routes_1.createAuthRoutes)(authService));
    // Protected API routes
    app.use('/api/finance', auth, (0, finance_routes_1.createFinanceRoutes)(createTransaction, cashService, transactionRepo));
    app.use('/api/finance/recurring', (0, recurring_routes_1.createRecurringRoutes)(recurringRepo, createTransaction));
    app.use('/api/project', auth, (0, project_routes_1.createProjectRoutes)(createProject, addProjectItem, costService, projectRepo));
    app.use('/api/inventory', auth, (0, inventory_routes_1.createInventoryRoutes)(createMaterial, addStock, stockService, materialRepo));
    app.use('/api/invoices', auth, (0, invoice_routes_1.createInvoiceRoutes)(invoiceRepo, invoiceService, eventBus));
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
//# sourceMappingURL=index.js.map