import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Plus, Target, X, Edit2, Check } from 'lucide-react';

interface BudgetItem {
  id: string;
  category: string;
  type: 'income' | 'expense';
  planned: number;
  actual: number;
  period: string;
}

const CATEGORIES: Record<string, string[]> = {
  income: ['Satış Geliri', 'Hizmet Geliri', 'Kira Geliri', 'Faiz Geliri', 'Diğer Gelir'],
  expense: ['Malzeme', 'İşçilik', 'Kira', 'Fatura', 'Maaş', 'Nakliye', 'Vergi', 'Pazarlama', 'Diğer Gider'],
};

export default function BudgetPage() {
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ category: '', type: 'expense' as 'income' | 'expense', planned: '', period: '' });

  useEffect(() => {
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setForm(f => ({ ...f, period }));

    Promise.all([
      api.get('/api/budget').then(r => r.data).catch(() => []),
      api.get('/api/finance/transactions').then(r => r.data).catch(() => []),
    ]).then(([budget, tx]) => {
      setItems(budget);
      setTransactions(tx);
      setLoading(false);
    });
  }, []);

  // Calculate actuals from transactions
  const getActual = (category: string, type: string, period: string) => {
    const [year, month] = period.split('-').map(Number);
    return transactions
      .filter(t => {
        const d = new Date(t.createdAt);
        return t.type === type && d.getFullYear() === year && d.getMonth() + 1 === month;
      })
      .reduce((s, t) => s + t.amount, 0);
  };

  const itemsWithActual = items.map(i => ({
    ...i,
    actual: getActual(i.category, i.type, i.period),
  }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/budget', { ...form, planned: parseFloat(form.planned) });
      // Refresh
    } catch {
      setItems(prev => [...prev, { id: Date.now().toString(), ...form, planned: parseFloat(form.planned), actual: 0 }]);
    }
    setShowForm(false);
    setForm({ category: '', type: 'expense', planned: '', period: form.period });
  };

  const handleDelete = async (id: string) => {
    try { await api.delete(`/api/budget/${id}`); } catch {}
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const formatCurrency = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n);
  const pct = (actual: number, planned: number) => planned > 0 ? Math.min((actual / planned) * 100, 100) : 0;

  const totalIncomePlan = itemsWithActual.filter(i => i.type === 'income').reduce((s, i) => s + i.planned, 0);
  const totalIncomeActual = itemsWithActual.filter(i => i.type === 'income').reduce((s, i) => s + i.actual, 0);
  const totalExpensePlan = itemsWithActual.filter(i => i.type === 'expense').reduce((s, i) => s + i.planned, 0);
  const totalExpenseActual = itemsWithActual.filter(i => i.type === 'expense').reduce((s, i) => s + i.actual, 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bütçe Planlama</h1>
          <p className="text-gray-500 text-sm mt-1">Aylık hedef ve gerçekleşme takibi</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          <Plus size={16} /> Bütçe Kalemi
        </button>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Gelir Hedefi vs Gerçek</span>
            <span className={`badge ${totalIncomeActual >= totalIncomePlan ? 'badge-green' : 'badge-yellow'}`}>
              {totalIncomePlan > 0 ? ((totalIncomeActual / totalIncomePlan) * 100).toFixed(0) : 0}%
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{formatCurrency(totalIncomeActual)}</span>
            <span className="text-sm text-gray-400">/ {formatCurrency(totalIncomePlan)}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-3">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct(totalIncomeActual, totalIncomePlan)}%` }} />
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Gider Hedefi vs Gerçek</span>
            <span className={`badge ${totalExpenseActual <= totalExpensePlan ? 'badge-green' : 'badge-red'}`}>
              {totalExpensePlan > 0 ? ((totalExpenseActual / totalExpensePlan) * 100).toFixed(0) : 0}%
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{formatCurrency(totalExpenseActual)}</span>
            <span className="text-sm text-gray-400">/ {formatCurrency(totalExpensePlan)}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-3">
            <div className={`h-full rounded-full transition-all ${totalExpenseActual > totalExpensePlan ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${pct(totalExpenseActual, totalExpensePlan)}%` }} />
          </div>
        </div>
      </div>

      {/* Budget Items */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Kategori</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Tip</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Dönem</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Planlanan</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Gerçek</th>
                <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">İlerleme</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {itemsWithActual.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-sm text-gray-500 py-8">
                  <Target size={32} className="mx-auto text-gray-300 mb-3" />
                  Bütçe kalemi ekleyin
                </td></tr>
              ) : (
                itemsWithActual.map(item => {
                  const progress = pct(item.actual, item.planned);
                  const isOverBudget = item.type === 'expense' && item.actual > item.planned;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{item.category}</td>
                      <td className="px-5 py-3.5">
                        <span className={`badge ${item.type === 'income' ? 'badge-green' : 'badge-red'}`}>
                          {item.type === 'income' ? 'Gelir' : 'Gider'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">{item.period}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-900 text-right font-medium">{formatCurrency(item.planned)}</td>
                      <td className="px-5 py-3.5 text-sm text-right font-medium">{formatCurrency(item.actual)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${isOverBudget ? 'bg-red-500' : progress > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${progress}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 w-10 text-right">{progress.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Budget Item Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Yeni Bütçe Kalemi</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tip</label>
                <select className="select" value={form.type} onChange={e => setForm({...form, type: e.target.value as any, category: ''})}>
                  <option value="income">Gelir</option>
                  <option value="expense">Gider</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select className="select" value={form.category} onChange={e => setForm({...form, category: e.target.value})} required>
                  <option value="">Seçiniz...</option>
                  {CATEGORIES[form.type].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Planlanan Tutar (₺)</label>
                <input type="number" step="0.01" className="input" placeholder="0.00" value={form.planned} onChange={e => setForm({...form, planned: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dönem (YYYY-AA)</label>
                <input type="month" className="input" value={form.period} onChange={e => setForm({...form, period: e.target.value})} required />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary flex-1">İptal</button>
                <button type="submit" className="btn btn-primary flex-1">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
