# ERP-Loxa - DDD-based Enterprise Resource Planning System

A Domain-Driven Design (DDD) based ERP system for business management, covering finance, inventory, project management, payment tracking, invoicing, and user authentication.

## 🏗️ Architecture

```
src/
├── domains/                    # Domain Layer (Business Logic)
│   ├── auth/                   # Auth Domain (JWT + Users)
│   │   ├── entities/           # User entity
│   │   ├── repositories/       # IUserRepository interface
│   │   └── services/           # AuthService (login, register, JWT)
│   │
│   ├── finance/                # Finance Domain (Kasa)
│   │   ├── entities/           # Transaction entity + enums
│   │   ├── events/             # TransactionCreated, TransactionCancelled
│   │   ├── repositories/       # ITransactionRepository interface
│   │   └── services/           # CashService (balance calculations)
│   │
│   ├── inventory/              # Inventory Domain (Stok)
│   │   ├── entities/           # Material, StockMovement entities
│   │   ├── events/             # StockAdjusted, LowStockWarning
│   │   ├── repositories/       # IMaterialRepository, IStockMovementRepository
│   │   └── services/           # StockService (stock operations)
│   │
│   ├── invoice/                # Invoice Domain (Fatura)
│   │   ├── entities/           # Invoice, InvoiceItem entities
│   │   ├── events/             # InvoiceCreated, InvoicePaid
│   │   ├── repositories/       # IInvoiceRepository interface
│   │   └── services/           # InvoiceService (overdue processing)
│   │
│   ├── project/                # Project Domain (Projeler)
│   │   ├── entities/           # Project, ProjectItem entities
│   │   ├── events/             # ProjectItemAdded, ProjectStatusChanged
│   │   ├── repositories/       # IProjectRepository interface
│   │   └── services/           # CostCalculationService
│   │
│   └── payment/                # Payment Domain (Çek/Ödeme)
│       ├── entities/           # Check entity + enums
│       ├── events/             # CheckPaid, CheckBounced
│       ├── repositories/       # ICheckRepository interface
│       └── services/           # CheckService (due date monitoring)
│
├── application/                # Application Layer (Use Cases)
│   └── use-cases/
│       ├── finance/            # CreateTransaction
│       ├── inventory/          # CreateMaterial, AddStock
│       ├── project/            # CreateProject, AddProjectItem
│       └── payment/            # CreateCheck, PayCheck
│
├── infrastructure/             # Infrastructure Layer
│   └── database/
│       ├── migrations/         # Knex migrations (SQLite)
│       └── repositories/       # SQLite repository implementations
│
├── interfaces/                 # Interface Layer (API)
│   └── api/
│       ├── routes/             # Express REST API routes
│       └── middleware/         # Auth middleware (JWT verification)
│
├── shared/                     # Shared Kernel
│   ├── types/                  # Base classes (Entity, ValueObject, AggregateRoot, Money)
│   └── errors/                 # Domain errors
│
└── index.ts                    # Application entry point

frontend/                       # React + Vite + TypeScript Frontend
├── src/
│   ├── components/             # Reusable UI components
│   ├── pages/                  # Dashboard, Finance, Inventory, Projects, Invoices, Login
│   ├── api/                    # API client with axios interceptors
│   ├── context/                # Auth context
│   └── App.tsx                 # Main app with routing
```

## 🔑 Core Domain Rules

1. **Stok manuel güncellenmez** - Sadece StockMovement ile değişir
2. **Transaction silinemez** - Sadece iptal (cancel) edilebilir
3. **Domain logic controller'da yazılmaz** - Entity ve service'lerde
4. **Tüm işlemler kayıt altına alınır** - Domain events ile
5. **Auth gerekli** - Tüm API endpoint'leri JWT token gerektirir (auth hariç)

## 🚀 Quick Start

```bash
# Backend
cd erp-core
npm install
npm run dev    # http://localhost:4051

# Frontend
cd frontend
npm install
npm run dev    # http://localhost:4050
```

## 🔐 Authentication

```bash
# Register
curl -X POST http://localhost:4051/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123","name":"Admin","role":"admin"}'

# Login
curl -X POST http://localhost:4051/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Use token in protected requests
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:4051/api/finance/transactions
```

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/register | Kullanıcı kaydı | ❌ |
| POST | /api/auth/login | Giriş yap | ❌ |
| GET | /api/auth/me | Mevcut kullanıcı | ✅ |

### Finance (Kasa)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/finance/transactions | Gelir/gider oluştur | ✅ |
| GET | /api/finance/transactions | İşlemleri listele | ✅ |
| GET | /api/finance/cash/balance | Kasa bakiyesi | ✅ |

### Inventory (Stok)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/inventory/materials | Malzeme tanımla | ✅ |
| GET | /api/inventory/materials | Malzemeleri listele | ✅ |
| GET | /api/inventory/materials/low-stock | Düşük stok | ✅ |
| POST | /api/inventory/materials/:id/stock | Stok ekle | ✅ |
| GET | /api/inventory/materials/:id/history | Stok geçmişi | ✅ |

### Project (Proje)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/project/projects | Proje oluştur | ✅ |
| GET | /api/project/projects | Projeleri listele | ✅ |
| GET | /api/project/projects/:id | Proje detayı | ✅ |
| POST | /api/project/projects/:id/items | Malzeme ekle | ✅ |
| PATCH | /api/project/projects/:id/status | Durum güncelle | ✅ |

### Invoice (Fatura)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/invoices | Fatura oluştur | ✅ |
| GET | /api/invoices | Faturaları listele | ✅ |
| GET | /api/invoices/:id | Fatura detayı | ✅ |
| PATCH | /api/invoices/:id/send | Fatura gönder | ✅ |
| PATCH | /api/invoices/:id/pay | Ödendi işaretle | ✅ |

## 🧪 Testing

```bash
npm test       # Run all tests
npm run test:watch  # Watch mode
```

49 tests across 6 test files covering:
- Money value object (11 tests)
- Transaction entity (8 tests)
- Material entity (7 tests)
- Project entity (7 tests)
- Check entity (7 tests)
- Invoice entity (9 tests)

## 💡 DDD Patterns Used

- **Aggregate Roots**: Transaction, Material, Project, Check, Invoice
- **Value Objects**: Money (amount + currency with decimal precision)
- **Domain Events**: Cross-aggregate communication
- **Domain Services**: CashService, StockService, CostCalculationService, CheckService, InvoiceService, AuthService
- **Repository Pattern**: Interface in domain, implementation in infrastructure
- **Use Cases**: Application layer orchestration
- **Factory Methods**: `Entity.create()` and `Entity.reconstitute()`
- **Auth Middleware**: JWT verification with role-based access

## 📦 Tech Stack

**Backend:**
- Node.js + TypeScript
- Express.js (REST API)
- SQLite (via Knex.js)
- JWT (jsonwebtoken)
- Zod (validation)
- Vitest (testing)

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- React Router (routing)
- Tailwind CSS (styling)
- Axios (HTTP client)
- Lucide React (icons)

## 📄 License

MIT
# ERP-Loxa
