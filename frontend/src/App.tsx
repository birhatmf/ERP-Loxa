import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import FinancePage from './pages/FinancePage';
import InventoryPage from './pages/InventoryPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import InvoicesPage from './pages/InvoicesPage';
import SalesPage from './pages/SalesPage';
import CustomersPage from './pages/CustomersPage';
import ChecksPage from './pages/ChecksPage';
import SuppliersPage from './pages/SuppliersPage';
import StockCountPage from './pages/StockCountPage';
import ReportsPage from './pages/ReportsPage';
import BudgetPage from './pages/BudgetPage';
import RecurringPage from './pages/RecurringPage';
import CategoriesPage from './pages/CategoriesPage';
import TaxCalculatorPage from './pages/TaxCalculatorPage';
import SettingsPage from './pages/SettingsPage';
import PayrollPage from './pages/PayrollPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/finance" element={<FinancePage />} />
                  <Route path="/finance/recurring" element={<RecurringPage />} />
                  <Route path="/inventory" element={<InventoryPage />} />
                  <Route path="/inventory/stock-count" element={<StockCountPage />} />
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/projects/:id" element={<ProjectDetailPage />} />
                  <Route path="/invoices" element={<InvoicesPage />} />
                  <Route path="/sales" element={<SalesPage />} />
                  <Route path="/customers" element={<CustomersPage />} />
                  <Route path="/checks" element={<ChecksPage />} />
                  <Route path="/suppliers" element={<SuppliersPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/budget" element={<BudgetPage />} />
                  <Route path="/payroll" element={<PayrollPage />} />
                  <Route path="/categories" element={<CategoriesPage />} />
                  <Route path="/tax-calculator" element={<TaxCalculatorPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
