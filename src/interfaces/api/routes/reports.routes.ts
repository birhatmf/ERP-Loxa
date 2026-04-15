import { Request, Response, Router } from 'express';
import { IInvoiceRepository } from '@domains/invoice';
import { IProjectRepository } from '@domains/project';
import { IMaterialRepository } from '@domains/inventory';
import { ITransactionRepository, TransactionStatus } from '@domains/finance';
import { logger } from '@shared/logger';

type ReportPeriod = 'month' | 'year' | 'all';

function getRange(period: ReportPeriod): { from?: Date; to?: Date } {
  const now = new Date();

  if (period === 'month') {
    return { from: new Date(now.getFullYear(), now.getMonth() - 5, 1), to: now };
  }

  if (period === 'year') {
    return { from: new Date(now.getFullYear() - 1, now.getMonth(), 1), to: now };
  }

  return {};
}

function monthKey(date: Date): string {
  return date.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' });
}

export function createReportsRoutes(
  transactionRepo: ITransactionRepository,
  projectRepo: IProjectRepository,
  invoiceRepo: IInvoiceRepository,
  materialRepo: IMaterialRepository
): Router {
  const router = Router();

  router.get('/reports/summary', async (req: Request, res: Response) => {
    try {
      const period = (req.query.period as ReportPeriod) || 'month';
      const range = getRange(period);

      const [transactions, projects, invoices, materials] = await Promise.all([
        range.from && range.to ? transactionRepo.findByDateRange(range.from, range.to) : transactionRepo.findAll(),
        projectRepo.findAll(),
        invoiceRepo.findAll(),
        materialRepo.findAll(),
      ]);

      const filteredTransactions = range.from && range.to
        ? transactions.filter(t => {
            const createdAt = new Date(t.createdAt);
            return createdAt >= range.from! && createdAt <= range.to!;
          })
        : transactions;

      const monthlyData: Array<{ month: string; income: number; expense: number; profit: number }> = [];
      const now = new Date();
      const monthCount = period === 'year' ? 12 : 6;
      for (let i = monthCount - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthTx = filteredTransactions.filter(t => {
          const td = new Date(t.createdAt);
          return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
        });
        const income = monthTx.filter(t => t.type === 'income' && t.status !== TransactionStatus.CANCELLED).reduce((s, t) => s + t.amount.amount, 0);
        const expense = monthTx.filter(t => t.type === 'expense' && t.status !== TransactionStatus.CANCELLED).reduce((s, t) => s + t.amount.amount, 0);
        monthlyData.push({ month: monthKey(d), income, expense, profit: income - expense });
      }

      const totalIncome = filteredTransactions.filter(t => t.type === 'income' && t.status !== TransactionStatus.CANCELLED).reduce((s, t) => s + t.amount.amount, 0);
      const totalExpense = filteredTransactions.filter(t => t.type === 'expense' && t.status !== TransactionStatus.CANCELLED).reduce((s, t) => s + t.amount.amount, 0);

      const paymentMethods: Record<string, number> = {};
      filteredTransactions
        .filter(t => t.status !== TransactionStatus.CANCELLED)
        .forEach(t => {
          paymentMethods[t.paymentMethod] = (paymentMethods[t.paymentMethod] || 0) + t.amount.amount;
        });

      const topProjects = projects
        .map(p => ({
          id: p.id,
          name: p.name,
          revenue: p.totalPrice.amount,
          cost: p.totalCost.amount,
          margin: p.profitMargin.amount,
        }))
        .sort((a, b) => b.margin - a.margin)
        .slice(0, 5);

      const overdueInvoices = invoices.filter(inv => inv.status === 'sent' || inv.status === 'overdue').length;
      const lowStockCount = materials.filter(m => m.isLowStock).length;

      res.json({
        period,
        totals: {
          income: totalIncome,
          expense: totalExpense,
          netProfit: totalIncome - totalExpense,
        },
        monthlyData,
        topProjects,
        paymentMethods,
        cashFlow: {
          expectedIncome: totalIncome / Math.max(monthlyData.length || 1, 1),
          expectedExpense: totalExpense / Math.max(monthlyData.length || 1, 1),
          netForecast: (totalIncome - totalExpense) / Math.max(monthlyData.length || 1, 1),
        },
        counts: {
          transactions: filteredTransactions.length,
          projects: projects.length,
          invoices: invoices.length,
          overdueInvoices,
          lowStockMaterials: lowStockCount,
        },
        transactions: filteredTransactions.map(t => ({
          id: t.id,
          createdAt: t.createdAt.toISOString(),
          type: t.type,
          amount: t.amount.amount,
          vatAmount: t.vatAmount.amount,
          paymentMethod: t.paymentMethod,
          description: t.description,
          status: t.status,
        })),
      });
    } catch (error: any) {
      logger.error('Failed to build reports summary', { error: error.message, period: req.query.period });
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
