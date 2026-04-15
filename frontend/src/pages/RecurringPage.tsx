import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Plus, RefreshCw, X, Play, Pause, Trash2, Calendar } from 'lucide-react';

interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  paymentMethod: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  dayOfMonth: number;
  isActive: boolean;
  nextRun: string;
  lastRun: string;
  createdAt: string;
}

const FREQ_LABELS: Record<string, string> = {
  daily: 'Günlük',
  weekly: 'Haftalık',
  monthly: 'Aylık',
  quarterly: '3 Aylık',
  yearly: 'Yıllık',
};

export default function RecurringPage() {
  const [items, setItems] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    description: '', amount: '', type: 'expense', category: '',
    paymentMethod: 'nakit', frequency: 'monthly', dayOfMonth: '1',
  });

  const fetchData = async () => {
    try {
      const { data } = await api.get('/api/finance/recurring');
      setItems(data);
    } catch { setItems([]); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/finance/recurring', { ...form, amount: parseFloat(form.amount), dayOfMonth: parseInt(form.dayOfMonth) });
      fetchData();
    } catch {
      setItems(prev => [{
        id: Date.now().toString(),
        description: form.description,
        amount: parseFloat(form.amount),
        type: form.type as 'income' | 'expense',
        category: form.category,
        paymentMethod: form.paymentMethod,
        frequency: form.frequency as 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly',
        dayOfMonth: parseInt(form.dayOfMonth),
        isActive: true,
        nextRun: new Date().toISOString(),
        lastRun: '',
        createdAt: new Date().toISOString(),
      }, ...prev]);
    }
    setShowForm(false);
    setForm({ description: '', amount: '', type: 'expense', category: '', paymentMethod: 'nakit', frequency: 'monthly', dayOfMonth: '1' });
    setSubmitting(false);
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await api.patch(`/api/finance/recurring/${id}`, { isActive: !isActive });
      fetchData();
    } catch {
      setItems(prev => prev.map(i => i.id === id ? { ...i, isActive: !i.isActive } : i));
    }
  };

  const deleteItem = async (id: string) => {
    try { await api.delete(`/api/finance/recurring/${id}`); } catch {}
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const runNow = async (id: string) => {
    try {
      await api.post(`/api/finance/recurring/${id}/run`);
      fetchData();
    } catch {}
  };

  const formatCurrency = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n);
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

  const totalMonthlyExpense = items.filter(i => i.isActive && i.type === 'expense').reduce((s, i) => {
    const m = i.frequency === 'monthly' ? 1 : i.frequency === 'quarterly' ? 1/3 : i.frequency === 'yearly' ? 1/12 : i.frequency === 'weekly' ? 4.33 : 30;
    return s + i.amount * m;
  }, 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tekrarlayan İşlemler</h1>
          <p className="text-gray-500 text-sm mt-1">Otomatik yinelenen gelir ve giderler</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          <Plus size={16} /> Yeni Tekrarlayan İşlem
        </button>
      </div>

      {/* Summary */}
      <div className="card p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-amber-700">Tahmini Aylık Sabit Gider</p>
            <p className="text-2xl font-bold text-amber-900">{formatCurrency(totalMonthlyExpense)}</p>
          </div>
          <RefreshCw size={24} className="text-amber-500" />
        </div>
      </div>

      {/* Items */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Durum</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Açıklama</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Tip</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Sıklık</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Sonraki</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Tutar</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-sm text-gray-500 py-8">
                  <RefreshCw size={32} className="mx-auto text-gray-300 mb-3" />
                  Tekrarlayan işlem yok
                </td></tr>
              ) : (
                items.map(item => (
                  <tr key={item.id} className={`hover:bg-gray-50 ${!item.isActive ? 'opacity-50' : ''}`}>
                    <td className="px-5 py-3.5">
                      <button onClick={() => toggleActive(item.id, item.isActive)} className={`w-8 h-4 rounded-full relative transition-colors ${item.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                        <span className={`absolute top-0.5 h-3 w-3 bg-white rounded-full shadow transition-all ${item.isActive ? 'left-4' : 'left-0.5'}`} />
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{item.description}</td>
                    <td className="px-5 py-3.5">
                      <span className={`badge ${item.type === 'income' ? 'badge-green' : 'badge-red'}`}>
                        {item.type === 'income' ? 'Gelir' : 'Gider'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{FREQ_LABELS[item.frequency] || item.frequency}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{formatDate(item.nextRun)}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-right whitespace-nowrap">
                      <span className={item.type === 'income' ? 'text-emerald-600' : 'text-red-600'}>
                        {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => runNow(item.id)} className="p-1.5 rounded text-brand-600 hover:bg-brand-50" title="Şimdi Çalıştır">
                          <Play size={14} />
                        </button>
                        <button onClick={() => deleteItem(item.id)} className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50" title="Sil">
                          <Trash2 size={14} />
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

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Yeni Tekrarlayan İşlem</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <input type="text" className="input" placeholder="Açıklayama (Örn: Aylık Kira) *" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tutar (₺) *</label>
                  <input type="number" step="0.01" className="input" placeholder="0.00" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tip</label>
                  <select className="select" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    <option value="expense">Gider</option>
                    <option value="income">Gelir</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sıklık</label>
                  <select className="select" value={form.frequency} onChange={e => setForm({...form, frequency: e.target.value})}>
                    <option value="daily">Günlük</option>
                    <option value="weekly">Haftalık</option>
                    <option value="monthly">Aylık</option>
                    <option value="quarterly">3 Aylık</option>
                    <option value="yearly">Yıllık</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ayın Günü</label>
                  <input type="number" min="1" max="28" className="input" placeholder="1" value={form.dayOfMonth} onChange={e => setForm({...form, dayOfMonth: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Örn: Kira, Maaş, Yazılım"
                  value={form.category}
                  onChange={e => setForm({...form, category: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Yöntemi</label>
                <select className="select" value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value})}>
                  <option value="nakit">Nakit</option>
                  <option value="havale">Havale/EFT</option>
                  <option value="kart">Kredi Kartı</option>
                  <option value="otomatik">Otomatik Ödeme</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary flex-1">İptal</button>
                <button type="submit" disabled={submitting} className="btn btn-primary flex-1">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
