import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { BarChart3, TrendingUp, TrendingDown, Calendar, Download } from 'lucide-react';

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
  profit: number;
}

interface TopProject {
  id: string;
  name: string;
  revenue: number;
  cost: number;
  margin: number;
}

interface ReportTransaction {
  id: string;
  createdAt: string;
  type: 'income' | 'expense';
  amount: number;
  vatAmount: number;
  paymentMethod: string;
  description: string;
  status: string;
}

interface ReportsSummary {
  period: 'month' | 'year' | 'all';
  totals: {
    income: number;
    expense: number;
    netProfit: number;
  };
  monthlyData: MonthlyData[];
  topProjects: TopProject[];
  paymentMethods: Record<string, number>;
  cashFlow: {
    expectedIncome: number;
    expectedExpense: number;
    netForecast: number;
  };
  counts: {
    transactions: number;
    projects: number;
    invoices: number;
    overdueInvoices: number;
    lowStockMaterials: number;
  };
  transactions: ReportTransaction[];
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<'month' | 'year' | 'all'>('month');
  const [summary, setSummary] = useState<ReportsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/api/reports/summary', { params: { period } })
      .then(({ data }) => setSummary(data))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, [period]);

  const formatCurrency = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n);

  const maxVal = useMemo(() => Math.max(...(summary?.monthlyData.map(d => Math.max(d.income, d.expense)) ?? [1]), 1), [summary]);
  const paymentTotal = useMemo(() => Object.values(summary?.paymentMethods ?? {}).reduce((s, v) => s + v, 0), [summary]);

  const exportCSV = () => {
    if (!summary) return;
    const headers = ['Tarih', 'Tip', 'Tutar', 'KDV', 'Ödeme', 'Açıklama'];
    const rows = summary.transactions.map(t => [
      new Date(t.createdAt).toLocaleDateString('tr-TR'),
      t.type === 'income' ? 'Gelir' : 'Gider',
      t.amount,
      t.vatAmount,
      t.paymentMethod,
      t.description,
    ]);
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapor_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" /></div>;

  const totals = summary?.totals ?? { income: 0, expense: 0, netProfit: 0 };
  const monthlyData = summary?.monthlyData ?? [];
  const topProjects = summary?.topProjects ?? [];
  const paymentMethods = summary?.paymentMethods ?? {};
  const counts = summary?.counts ?? { transactions: 0, projects: 0, invoices: 0, overdueInvoices: 0, lowStockMaterials: 0 };
  const cashFlow = summary?.cashFlow ?? { expectedIncome: 0, expectedExpense: 0, netForecast: 0 };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Raporlar</h1>
          <p className="text-gray-500 text-sm mt-1">Gerçek verilerden finansal özet ve analiz</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="select" value={period} onChange={e => setPeriod(e.target.value as 'month' | 'year' | 'all')}>
            <option value="month">Son 6 Ay</option>
            <option value="year">Son 12 Ay</option>
            <option value="all">Tümü</option>
          </select>
          <button onClick={exportCSV} className="btn btn-secondary">
            <Download size={16} /> CSV İndir
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-emerald-500" />
            <span className="text-sm text-gray-500">Toplam Gelir</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totals.income)}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={16} className="text-red-500" />
            <span className="text-sm text-gray-500">Toplam Gider</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totals.expense)}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={16} className="text-brand-500" />
            <span className="text-sm text-gray-500">Net Kâr</span>
          </div>
          <p className={`text-2xl font-bold ${totals.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatCurrency(totals.netProfit)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card p-4">
          <p className="text-xs text-gray-500">İşlem Sayısı</p>
          <p className="text-lg font-bold text-gray-900">{counts.transactions}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">Proje</p>
          <p className="text-lg font-bold text-gray-900">{counts.projects}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">Fatura</p>
          <p className="text-lg font-bold text-gray-900">{counts.invoices}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">Vadesi Geçen</p>
          <p className="text-lg font-bold text-gray-900">{counts.overdueInvoices}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">Kritik Stok</p>
          <p className="text-lg font-bold text-gray-900">{counts.lowStockMaterials}</p>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Aylık Gelir / Gider</h3>
        <div className="space-y-3">
          {monthlyData.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">Bu dönem için veri yok</p>
          ) : (
            monthlyData.map(d => (
              <div key={d.month} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-16 shrink-0">{d.month}</span>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="h-5 bg-emerald-500/20 rounded-full flex items-center" style={{ width: `${Math.max((d.income / maxVal) * 100, d.income > 0 ? 8 : 0)}%` }}>
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
                    </div>
                    <span className="text-xs text-emerald-700 font-medium">{formatCurrency(d.income)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-5 bg-red-500/20 rounded-full flex items-center" style={{ width: `${Math.max((d.expense / maxVal) * 100, d.expense > 0 ? 8 : 0)}%` }}>
                      <div className="h-full bg-red-500 rounded-full" style={{ width: '100%' }} />
                    </div>
                    <span className="text-xs text-red-700 font-medium">{formatCurrency(d.expense)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">En Kârlı Projeler</h3>
          {topProjects.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Proje verisi yok</p>
          ) : (
            <div className="space-y-3">
              {topProjects.map((p, i) => (
                <div key={p.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>{i + 1}</span>
                    <span className="text-sm font-medium text-gray-900">{p.name}</span>
                  </div>
                  <span className={`text-sm font-semibold ${p.margin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(p.margin)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Ödeme Yöntemleri</h3>
          {Object.keys(paymentMethods).length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">İşlem verisi yok</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(paymentMethods).sort((a, b) => b[1] - a[1]).map(([method, amount]) => {
                const pct = paymentTotal > 0 ? (amount / paymentTotal) * 100 : 0;
                const labels: Record<string, string> = { nakit: 'Nakit', havale: 'Havale/EFT', kart: 'Kredi Kartı' };
                const colors: Record<string, string> = { nakit: 'bg-emerald-500', havale: 'bg-blue-500', kart: 'bg-purple-500' };
                return (
                  <div key={method}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">{labels[method] || method}</span>
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(amount)} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${colors[method] || 'bg-gray-400'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar size={16} /> Nakit Akışı Tahmini
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-emerald-50 rounded-lg p-4">
            <p className="text-xs text-emerald-700 mb-1">Beklenen Giriş</p>
            <p className="text-xl font-bold text-emerald-800">{formatCurrency(cashFlow.expectedIncome)}</p>
            <p className="text-xs text-emerald-600 mt-1">Dönem ortalaması</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-xs text-red-700 mb-1">Beklenen Çıkış</p>
            <p className="text-xl font-bold text-red-800">{formatCurrency(cashFlow.expectedExpense)}</p>
            <p className="text-xs text-red-600 mt-1">Dönem ortalaması</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-xs text-blue-700 mb-1">Net Tahmin</p>
            <p className="text-xl font-bold text-blue-800">{formatCurrency(cashFlow.netForecast)}</p>
            <p className="text-xs text-blue-600 mt-1">Dönem ortalamasına göre</p>
          </div>
        </div>
      </div>
    </div>
  );
}
