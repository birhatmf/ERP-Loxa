import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Plus, Landmark, X, Check, AlertTriangle } from 'lucide-react';

interface Check {
  id: string;
  type: 'received' | 'given';
  amount: number;
  dueDate: string;
  ownerName: string;
  checkNumber: string;
  bankName: string;
  description: string;
  status: 'pending' | 'paid' | 'returned' | 'cancelled';
  paidDate: string;
  createdAt: string;
}

const TYPE_MAP: Record<string, { label: string; class: string }> = {
  received: { label: 'Alınan', class: 'badge-green' },
  given: { label: 'Verilen', class: 'badge-blue' },
};

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  pending: { label: 'Bekliyor', class: 'badge-yellow' },
  paid: { label: 'Tahsil Edildi', class: 'badge-green' },
  returned: { label: 'Karşılıksız', class: 'badge-red' },
  cancelled: { label: 'İptal', class: 'badge-gray' },
};

export default function ChecksPage() {
  const [checks, setChecks] = useState<Check[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    type: 'received', amount: '', dueDate: '', ownerName: '',
    checkNumber: '', bankName: '', description: '',
  });

  const fetchChecks = async () => {
    try {
      const { data } = await api.get('/api/payment/checks');
      setChecks(data);
    } catch { setChecks([]); }
    setLoading(false);
  };

  useEffect(() => { fetchChecks(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/payment/checks', { ...form, amount: parseFloat(form.amount) });
      setShowForm(false);
      setForm({ type: 'received', amount: '', dueDate: '', ownerName: '', checkNumber: '', bankName: '', description: '' });
      fetchChecks();
    } catch {
      const newCheck: Check = {
        id: Date.now().toString(),
        type: form.type as any,
        amount: parseFloat(form.amount),
        dueDate: form.dueDate,
        ownerName: form.ownerName,
        checkNumber: form.checkNumber,
        bankName: form.bankName,
        description: form.description,
        status: 'pending',
        paidDate: '',
        createdAt: new Date().toISOString(),
      };
      setChecks(prev => [newCheck, ...prev]);
      setShowForm(false);
      setForm({ type: 'received', amount: '', dueDate: '', ownerName: '', checkNumber: '', bankName: '', description: '' });
    }
    setSubmitting(false);
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.patch(`/api/payment/checks/${id}/status`, { status });
      fetchChecks();
    } catch {
      setChecks(prev => prev.map(c => c.id === id ? { ...c, status: status as any, paidDate: status === 'paid' ? new Date().toISOString() : '' } : c));
    }
  };

  const formatCurrency = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n);
  const formatDate = (d: string) => new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });

  const pendingChecks = checks.filter(c => c.status === 'pending');
  const overdueChecks = pendingChecks.filter(c => new Date(c.dueDate) < new Date());
  const upcomingChecks = pendingChecks.filter(c => {
    const daysLeft = Math.ceil((new Date(c.dueDate).getTime() - Date.now()) / 86400000);
    return daysLeft > 0 && daysLeft <= 7;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Çek & Senet</h1>
          <p className="text-gray-500 text-sm mt-1">Çek takibi ve vade yönetimi</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          <Plus size={16} /> Yeni Çek
        </button>
      </div>

      {/* Alert Banners */}
      {overdueChecks.length > 0 && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700"><span className="font-semibold">{overdueChecks.length} çek</span> vadesi geçmiş!</p>
        </div>
      )}
      {upcomingChecks.length > 0 && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-center gap-3">
          <AlertTriangle size={18} className="text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-700"><span className="font-semibold">{upcomingChecks.length} çek</span> vadesi 7 gün içinde dolacak.</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs text-gray-500">Toplam Bekleyen</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(pendingChecks.reduce((s, c) => s + c.amount, 0))}</p>
          <p className="text-xs text-gray-400">{pendingChecks.length} adet</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">Alınan Çekler</p>
          <p className="text-xl font-bold text-emerald-600">{formatCurrency(pendingChecks.filter(c => c.type === 'received').reduce((s, c) => s + c.amount, 0))}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">Verilen Çekler</p>
          <p className="text-xl font-bold text-blue-600">{formatCurrency(pendingChecks.filter(c => c.type === 'given').reduce((s, c) => s + c.amount, 0))}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">Vadesi Geçen</p>
          <p className="text-xl font-bold text-red-600">{formatCurrency(overdueChecks.reduce((s, c) => s + c.amount, 0))}</p>
        </div>
      </div>

      {/* Checks Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Çek No</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Tip</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Keşideci</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Banka</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Vade</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Durum</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Tutar</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {checks.length === 0 ? (
                <tr><td colSpan={8} className="text-center text-sm text-gray-500 py-8">
                  <Landmark size={32} className="mx-auto text-gray-300 mb-3" />
                  Henüz çek kaydı yok
                </td></tr>
              ) : (
                checks.map(c => {
                  const isOverdue = c.status === 'pending' && new Date(c.dueDate) < new Date();
                  return (
                    <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${isOverdue ? 'bg-red-50/30' : ''}`}>
                      <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{c.checkNumber || '-'}</td>
                      <td className="px-5 py-3.5">
                        <span className={`badge ${TYPE_MAP[c.type]?.class}`}>{TYPE_MAP[c.type]?.label}</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">{c.ownerName}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">{c.bankName || '-'}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-sm ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                          {formatDate(c.dueDate)}
                          {isOverdue && ' ⚠'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`badge ${STATUS_MAP[c.status]?.class}`}>{STATUS_MAP[c.status]?.label}</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-gray-900 text-right whitespace-nowrap">{formatCurrency(c.amount)}</td>
                      <td className="px-5 py-3.5 text-right">
                        {c.status === 'pending' && (
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => handleStatusChange(c.id, 'paid')} className="btn btn-success !px-2 !py-1 text-[10px]">
                              <Check size={12} /> Tahsil
                            </button>
                            <button onClick={() => handleStatusChange(c.id, 'returned')} className="btn btn-danger !px-2 !py-1 text-[10px]">
                              İade
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Check Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Yeni Çek</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tip</label>
                  <select className="select" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    <option value="received">Alınan Çek</option>
                    <option value="given">Verilen Çek</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tutar (₺)</label>
                  <input type="number" step="0.01" className="input" placeholder="0.00" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Çek No</label>
                  <input type="text" className="input" placeholder="Çek numarası" value={form.checkNumber} onChange={e => setForm({...form, checkNumber: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Vade Tarihi</label>
                  <input type="date" className="input" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Keşideci</label>
                <input type="text" className="input" placeholder="Çeki düzenleyen kişi/firma" value={form.ownerName} onChange={e => setForm({...form, ownerName: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Banka</label>
                <input type="text" className="input" placeholder="Banka adı" value={form.bankName} onChange={e => setForm({...form, bankName: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Açıklama</label>
                <input type="text" className="input" placeholder="Ek bilgi" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
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
