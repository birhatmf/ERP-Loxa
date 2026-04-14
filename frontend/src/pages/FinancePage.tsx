import React, { useEffect, useState } from 'react';
import api from '../api/client';
import type { Transaction, CashBalance } from '../types';
import { Plus, ArrowUpRight, ArrowDownRight, Banknote, CreditCard, Building2, X } from 'lucide-react';

const PAYMENT_METHODS: Record<string, { label: string; icon: React.ReactNode }> = {
  nakit: { label: 'Nakit', icon: <Banknote size={14} /> },
  havale: { label: 'Havale', icon: <Building2 size={14} /> },
  kart: { label: 'Kart', icon: <CreditCard size={14} /> },
};

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState<CashBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    amount: '', vatAmount: '', type: 'income' as 'income' | 'expense',
    paymentMethod: 'nakit' as 'nakit' | 'havale' | 'kart',
    isInvoiced: false, description: '', createdBy: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    const [txRes, balRes] = await Promise.all([
      api.get('/api/finance/transactions'),
      api.get('/api/finance/cash/balance'),
    ]);
    setTransactions(txRes.data);
    setBalance(balRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/finance/transactions', {
        ...form,
        amount: parseFloat(form.amount),
        vatAmount: parseFloat(form.vatAmount) || 0,
      });
      setShowForm(false);
      setForm({ amount: '', vatAmount: '', type: 'income', paymentMethod: 'nakit', isInvoiced: false, description: '', createdBy: '' });
      fetchData();
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n);
  const formatDate = (d: string) => new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kasa Yönetimi</h1>
          <p className="text-gray-500 text-sm mt-1">Gelir ve gider takibi</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          <Plus size={16} /> Yeni İşlem
        </button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-sm text-gray-500 mb-1">Net Bakiye</p>
          <p className={`text-2xl font-bold ${(balance?.netBalance || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatCurrency(balance?.netBalance || 0)}
          </p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpRight size={14} className="text-emerald-500" />
            <p className="text-sm text-gray-500">Toplam Gelir</p>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(balance?.totalIncome || 0)}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownRight size={14} className="text-red-500" />
            <p className="text-sm text-gray-500">Toplam Gider</p>
          </div>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(balance?.totalExpenses || 0)}</p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Son İşlemler</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Tarih</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Açıklama</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Tip</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Ödeme</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Fatura</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Tutar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-sm text-gray-500 py-8">Henüz işlem bulunmuyor</td></tr>
              ) : (
                transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-sm text-gray-500 whitespace-nowrap">{formatDate(tx.createdAt)}</td>
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{tx.description || '-'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`badge ${tx.type === 'income' ? 'badge-green' : 'badge-red'}`}>
                        {tx.type === 'income' ? 'Gelir' : 'Gider'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                        {PAYMENT_METHODS[tx.paymentMethod]?.icon}
                        {PAYMENT_METHODS[tx.paymentMethod]?.label || tx.paymentMethod}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`badge ${tx.isInvoiced ? 'badge-blue' : 'badge-gray'}`}>
                        {tx.isInvoiced ? 'Faturalı' : 'Faturasız'}
                      </span>
                    </td>
                    <td className={`px-5 py-3.5 text-sm font-semibold text-right whitespace-nowrap ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Transaction Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Yeni İşlem</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tutar (₺)</label>
                  <input type="number" step="0.01" className="input" placeholder="0.00" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">KDV Tutarı</label>
                  <input type="number" step="0.01" className="input" placeholder="0.00" value={form.vatAmount} onChange={e => setForm({...form, vatAmount: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">İşlem Tipi</label>
                  <select className="select" value={form.type} onChange={e => setForm({...form, type: e.target.value as any})}>
                    <option value="income">Gelir</option>
                    <option value="expense">Gider</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Ödeme Yöntemi</label>
                  <select className="select" value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value as any})}>
                    <option value="nakit">Nakit</option>
                    <option value="havale">Havale</option>
                    <option value="kart">Kart</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Açıklama</label>
                <input type="text" className="input" placeholder="İşlem açıklaması" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Oluşturan</label>
                <input type="text" className="input" placeholder="Adınız" value={form.createdBy} onChange={e => setForm({...form, createdBy: e.target.value})} required />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300 text-brand-600 focus:ring-brand-500" checked={form.isInvoiced} onChange={e => setForm({...form, isInvoiced: e.target.checked})} />
                <span className="text-sm text-gray-700">Faturalandı</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary flex-1">İptal</button>
                <button type="submit" disabled={submitting} className="btn btn-primary flex-1">
                  {submitting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
