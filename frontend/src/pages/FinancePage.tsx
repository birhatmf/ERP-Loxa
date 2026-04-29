import React, { useEffect, useState } from 'react';
import api from '../api/client';
import type { Transaction, CashBalance } from '../types';
import { Plus, ArrowUpRight, ArrowDownRight, Banknote, CreditCard, Building2, X, Pencil, Trash2 } from 'lucide-react';

const PAYMENT_METHODS: Record<string, { label: string; icon: React.ReactNode }> = {
  nakit: { label: 'Nakit', icon: <Banknote size={14} /> },
  havale: { label: 'Havale', icon: <Building2 size={14} /> },
  kart: { label: 'Kart', icon: <CreditCard size={14} /> },
};

function toDateTimeLocal(value: Date | string = new Date()): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState<CashBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [personFilter, setPersonFilter] = useState('');
  const [form, setForm] = useState({
    amount: '', vatAmount: '', type: 'income' as 'income' | 'expense',
    paymentMethod: 'nakit' as 'nakit' | 'havale' | 'kart',
    isInvoiced: false, description: '', createdBy: '', createdAt: toDateTimeLocal(),
  });
  const [editForm, setEditForm] = useState({
    amount: '',
    vatAmount: '',
    type: 'income' as 'income' | 'expense',
    paymentMethod: 'nakit' as 'nakit' | 'havale' | 'kart',
    isInvoiced: false,
    description: '',
    createdBy: '',
    createdAt: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    const [txRes, balRes] = await Promise.all([
      api.get('/api/finance/transactions'),
      api.get('/api/finance/cash/balance'),
    ]);
    setTransactions(txRes.data.filter((tx: Transaction) => tx.status !== 'cancelled'));
    setBalance(balRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const personOptions = Array.from(
    new Set(transactions.map(tx => tx.createdBy?.trim()).filter((name): name is string => Boolean(name)))
  ).sort((a, b) => a.localeCompare(b, 'tr'));

  const visibleTransactions = personFilter
    ? transactions.filter(tx => tx.createdBy === personFilter)
    : transactions;

  const visibleSummary = personFilter
    ? visibleTransactions.reduce(
        (summary, tx) => {
          if (tx.type === 'income') summary.totalIncome += tx.amount;
          if (tx.type === 'expense') summary.totalExpenses += tx.amount;
          summary.netBalance = summary.totalIncome - summary.totalExpenses;
          return summary;
        },
        { totalIncome: 0, totalExpenses: 0, netBalance: 0 }
      )
    : {
        totalIncome: balance?.totalIncome || 0,
        totalExpenses: balance?.totalExpenses || 0,
        netBalance: balance?.netBalance || 0,
      };

  const openCreate = () => {
    setForm(prev => ({
      ...prev,
      createdBy: personFilter || prev.createdBy,
      createdAt: prev.createdAt || toDateTimeLocal(),
    }));
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/finance/transactions', {
        ...form,
        amount: parseFloat(form.amount),
        vatAmount: parseFloat(form.vatAmount) || 0,
        createdAt: form.createdAt ? new Date(form.createdAt).toISOString() : undefined,
      });
      setShowForm(false);
      setForm({ amount: '', vatAmount: '', type: 'income', paymentMethod: 'nakit', isInvoiced: false, description: '', createdBy: personFilter, createdAt: toDateTimeLocal() });
      fetchData();
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setEditForm({
      amount: String(tx.amount),
      vatAmount: String(tx.vatAmount),
      type: tx.type,
      paymentMethod: tx.paymentMethod,
      isInvoiced: tx.isInvoiced,
      description: tx.description,
      createdBy: tx.createdBy,
      createdAt: toDateTimeLocal(tx.createdAt),
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    setSubmitting(true);
    try {
      const { data } = await api.patch(`/api/finance/transactions/${editingTransaction.id}`, {
        amount: parseFloat(editForm.amount),
        vatAmount: parseFloat(editForm.vatAmount) || 0,
        type: editForm.type,
        paymentMethod: editForm.paymentMethod,
        isInvoiced: editForm.isInvoiced,
        description: editForm.description,
        createdBy: editForm.createdBy,
        createdAt: editForm.createdAt ? new Date(editForm.createdAt).toISOString() : undefined,
      });
      setTransactions(prev => prev.map(tx => tx.id === editingTransaction.id ? { ...tx, ...data } : tx));
      setEditingTransaction(null);
      fetchData();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (tx: Transaction) => {
    const confirmed = window.confirm(`"${tx.description}" işlemini iptal etmek istiyor musun?`);
    if (!confirmed) return;

    setSubmitting(true);
    try {
      const { data } = await api.delete(`/api/finance/transactions/${tx.id}`);
      setTransactions(prev => prev.filter(item => item.id !== tx.id));
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
        <button onClick={openCreate} className="btn btn-primary">
          <Plus size={16} /> Yeni İşlem
        </button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-sm text-gray-500 mb-1">Net Bakiye</p>
          <p className={`text-2xl font-bold ${visibleSummary.netBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatCurrency(visibleSummary.netBalance)}
          </p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpRight size={14} className="text-emerald-500" />
            <p className="text-sm text-gray-500">Toplam Gelir</p>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(visibleSummary.totalIncome)}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownRight size={14} className="text-red-500" />
            <p className="text-sm text-gray-500">Toplam Gider</p>
          </div>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(visibleSummary.totalExpenses)}</p>
        </div>
      </div>

      <datalist id="finance-person-options">
        {personOptions.map(person => <option key={person} value={person} />)}
      </datalist>

      {/* Transactions Table */}
      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Son İşlemler</h2>
            {personFilter && <p className="text-sm text-gray-500 mt-1">{personFilter} için {visibleTransactions.length} işlem listeleniyor</p>}
          </div>
          <div className="w-full sm:w-64">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ödemeyi Yapan</label>
            <select className="select" value={personFilter} onChange={e => setPersonFilter(e.target.value)}>
              <option value="">Tüm kişiler</option>
              {personOptions.map(person => <option key={person} value={person}>{person}</option>)}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Tarih</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Kişi</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Açıklama</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Tip</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Ödeme</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Fatura</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Tutar</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visibleTransactions.length === 0 ? (
                <tr><td colSpan={8} className="text-center text-sm text-gray-500 py-8">Henüz işlem bulunmuyor</td></tr>
              ) : (
                visibleTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-sm text-gray-500 whitespace-nowrap">{formatDate(tx.createdAt)}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600 whitespace-nowrap">{tx.createdBy || '-'}</td>
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
                      <div className="flex flex-wrap gap-2">
                        <span className={`badge ${tx.isInvoiced ? 'badge-blue' : 'badge-gray'}`}>
                          {tx.isInvoiced ? 'Faturalı' : 'Faturasız'}
                        </span>
                        {tx.status === 'cancelled' && (
                          <span className="badge badge-red">İptal</span>
                        )}
                      </div>
                    </td>
                    <td className={`px-5 py-3.5 text-sm font-semibold text-right whitespace-nowrap ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(tx)}
                          disabled={tx.status === 'cancelled'}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40"
                        >
                          <Pencil size={14} />
                          Düzenle
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(tx)}
                          disabled={tx.status === 'cancelled'}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-40"
                        >
                          <Trash2 size={14} />
                          Sil
                        </button>
                      </div>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">İşlem Tarihi</label>
                <input type="datetime-local" className="input" value={form.createdAt} onChange={e => setForm({...form, createdAt: e.target.value})} required />
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ödemeyi Yapan</label>
                <input type="text" list="finance-person-options" className="input" placeholder="Adınız" value={form.createdBy} onChange={e => setForm({...form, createdBy: e.target.value})} required />
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

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">İşlem Düzenle</h3>
              <button onClick={() => setEditingTransaction(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tutar (₺)</label>
                  <input type="number" step="0.01" className="input" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">KDV Tutarı</label>
                  <input type="number" step="0.01" className="input" value={editForm.vatAmount} onChange={e => setEditForm({...editForm, vatAmount: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">İşlem Tarihi</label>
                <input type="datetime-local" className="input" value={editForm.createdAt} onChange={e => setEditForm({...editForm, createdAt: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">İşlem Tipi</label>
                  <select className="select" value={editForm.type} onChange={e => setEditForm({...editForm, type: e.target.value as any})}>
                    <option value="income">Gelir</option>
                    <option value="expense">Gider</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Ödeme Yöntemi</label>
                  <select className="select" value={editForm.paymentMethod} onChange={e => setEditForm({...editForm, paymentMethod: e.target.value as any})}>
                    <option value="nakit">Nakit</option>
                    <option value="havale">Havale</option>
                    <option value="kart">Kart</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Açıklama</label>
                <input type="text" className="input" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ödemeyi Yapan</label>
                <input type="text" list="finance-person-options" className="input" value={editForm.createdBy} onChange={e => setEditForm({...editForm, createdBy: e.target.value})} required />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300 text-brand-600 focus:ring-brand-500" checked={editForm.isInvoiced} onChange={e => setEditForm({...editForm, isInvoiced: e.target.checked})} />
                <span className="text-sm text-gray-700">Faturalandı</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingTransaction(null)} className="btn btn-secondary flex-1">İptal</button>
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
