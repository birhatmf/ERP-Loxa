import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { BarChart3, TrendingUp, TrendingDown, Calendar, Download } from 'lucide-react';

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
  profit: number;
}

interface TopProject {
  name: string;
  revenue: number;
  cost: number;
  margin: number;
}

export default function ReportsPage() {
  const [period, setPeriod] = useState('month');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/finance/transactions').then(r => r.data).catch(() => []),
      api.get('/api/project/projects').then(r => r.data).catch(() => []),
    ]).then(([tx, proj]) => {
      setTransactions(tx);
      setProjects(proj);
      setLoading(false);
    });
  }, []);

  // Group transactions by month
  const monthlyData: MonthlyData[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' });
    const monthTx = transactions.filter(t => {
      const td = new Date(t.createdAt);
      return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
    });
    const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    monthlyData.push({ month: key, income, expense, profit: income - expense });
  }

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const maxVal = Math.max(...monthlyData.map(d => Math.max(d.income, d.expense)), 1);

  // Top projects by margin
  const topProjects: TopProject[] = projects
    .map(p => ({ name: p.name, revenue: p.totalPrice, cost: p.totalCost, margin: p.profitMargin }))
    .sort((a, b) => b.margin - a.margin)
    .slice(0, 5);

  // Payment method breakdown
  const paymentMethods: Record<string, number> = {};
  transactions.forEach(t => {
    paymentMethods[t.paymentMethod] = (paymentMethods[t.paymentMethod] || 0) + t.amount;
  });
  const paymentTotal = Object.values(paymentMethods).reduce((s, v) => s + v, 0);

  const formatCurrency = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n);

  const exportCSV = () => {
    const headers = ['Tarih', 'Tip', 'Tutar', 'KDV', 'Ödeme', 'Açıklama'];
    const rows = transactions.map(t => [
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Raporlar</h1>
          <p className="text-gray-500 text-sm mt-1">Finansal özet ve analiz</p>
        </div>
        <button onClick={exportCSV} className="btn btn-secondary">
          <Download size={16} /> CSV İndir
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-emerald-500" />
            <span className="text-sm text-gray-500">Toplam Gelir</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={16} className="text-red-500" />
            <span className="text-sm text-gray-500">Toplam Gider</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={16} className="text-brand-500" />
            <span className="text-sm text-gray-500">Net Kâr</span>
          </div>
          <p className={`text-2xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatCurrency(totalIncome - totalExpense)}
          </p>
        </div>
      </div>

      {/* Monthly Bar Chart */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Aylık Gelir / Gider</h3>
        <div className="space-y-3">
          {monthlyData.map(d => (
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
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Projects */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">En Kârlı Projeler</h3>
          {topProjects.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Proje verisi yok</p>
          ) : (
            <div className="space-y-3">
              {topProjects.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between">
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

        {/* Payment Method Breakdown */}
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

      {/* Cash Flow Projection */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar size={16} /> Nakit Akışı Tahmini (Sonraki Ay)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-emerald-50 rounded-lg p-4">
            <p className="text-xs text-emerald-700 mb-1">Beklenen Giriş</p>
            <p className="text-xl font-bold text-emerald-800">
              {formatCurrency(transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0) / 6)}
            </p>
            <p className="text-xs text-emerald-600 mt-1">Ort. aylık gelir bazlı</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-xs text-red-700 mb-1">Beklenen Çıkış</p>
            <p className="text-xl font-bold text-red-800">
              {formatCurrency(transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0) / 6)}
            </p>
            <p className="text-xs text-red-600 mt-1">Ort. aylık gider bazlı</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-xs text-blue-700 mb-1">Net Tahmin</p>
            <p className="text-xl font-bold text-blue-800">
              {formatCurrency((totalIncome - totalExpense) / 6)}
            </p>
            <p className="text-xs text-blue-600 mt-1">Tarihsel ortalamaya göre</p>
          </div>
        </div>
      </div>
    </div>
  );
}
