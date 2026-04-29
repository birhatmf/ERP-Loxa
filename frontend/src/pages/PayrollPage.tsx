import React, { useEffect, useMemo, useState } from 'react';
import { Banknote, CalendarDays, Plus, Trash2, UserPlus, WalletCards, X } from 'lucide-react';
import api from '../api/client';

interface Worker {
  id: string;
  name: string;
  monthlySalary: number;
  isActive: boolean;
}

interface WorkerAdvance {
  id: string;
  workerId: string;
  amount: number;
  paidAt: string;
  note: string;
}

interface PayrollRow {
  worker: Worker;
  period: string;
  salary: number;
  advanceTotal: number;
  remainingSalary: number;
  advances: WorkerAdvance[];
}

interface PayrollSummary {
  period: string;
  rows: PayrollRow[];
  totals: {
    salary: number;
    advances: number;
    remaining: number;
  };
}

function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7);
}

function todayInput(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function PayrollPage() {
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [period, setPeriod] = useState(currentPeriod());
  const [loading, setLoading] = useState(true);
  const [showWorkerForm, setShowWorkerForm] = useState(false);
  const [advanceWorker, setAdvanceWorker] = useState<PayrollRow | null>(null);
  const [workerForm, setWorkerForm] = useState({ name: '', monthlySalary: '' });
  const [salaryDrafts, setSalaryDrafts] = useState<Record<string, string>>({});
  const [advanceForm, setAdvanceForm] = useState({ amount: '', paidAt: todayInput(), note: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<PayrollSummary>('/api/payroll/summary', { params: { period } });
      setSummary(data);
      setSalaryDrafts(Object.fromEntries(data.rows.map(row => [row.worker.id, String(row.salary)])));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [period]);

  const activeRows = useMemo(
    () => (summary?.rows ?? []).filter(row => row.worker.isActive),
    [summary]
  );

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });

  const createWorker = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/payroll/workers', {
        name: workerForm.name,
        monthlySalary: Number(workerForm.monthlySalary) || 0,
      });
      setWorkerForm({ name: '', monthlySalary: '' });
      setShowWorkerForm(false);
      await fetchSummary();
    } finally {
      setSubmitting(false);
    }
  };

  const saveSalary = async (row: PayrollRow) => {
    const salary = Number(salaryDrafts[row.worker.id] ?? row.salary);
    if (!Number.isFinite(salary) || salary < 0) return;

    setSubmitting(true);
    try {
      await api.put(`/api/payroll/workers/${row.worker.id}/months/${period}`, { salary });
      await fetchSummary();
    } finally {
      setSubmitting(false);
    }
  };

  const openAdvance = (row: PayrollRow) => {
    setAdvanceWorker(row);
    setAdvanceForm({ amount: '', paidAt: todayInput(), note: '' });
  };

  const addAdvance = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!advanceWorker) return;

    setSubmitting(true);
    try {
      await api.post(`/api/payroll/workers/${advanceWorker.worker.id}/advances`, {
        amount: Number(advanceForm.amount) || 0,
        paidAt: new Date(advanceForm.paidAt).toISOString(),
        period,
        note: advanceForm.note,
      });
      setAdvanceWorker(null);
      await fetchSummary();
    } finally {
      setSubmitting(false);
    }
  };

  const deleteAdvance = async (advanceId: string) => {
    if (!window.confirm('Bu avans kaydını silmek istiyor musun?')) return;
    await api.delete(`/api/payroll/advances/${advanceId}`);
    await fetchSummary();
  };

  if (loading && !summary) {
    return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maaş & Avans</h1>
          <p className="mt-1 text-sm text-gray-500">İşçi bazlı aylık maaş, avans ve kalan maaş takibi</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600">
            <CalendarDays size={16} />
            <input type="month" className="bg-transparent outline-none" value={period} onChange={event => setPeriod(event.target.value)} />
          </label>
          <button onClick={() => setShowWorkerForm(true)} className="btn btn-primary">
            <UserPlus size={16} /> İşçi Ekle
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <div className="mb-1 flex items-center gap-2 text-sm text-gray-500"><Banknote size={14} /> Toplam Maaş</div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary?.totals.salary ?? 0)}</p>
        </div>
        <div className="card p-5">
          <div className="mb-1 flex items-center gap-2 text-sm text-gray-500"><WalletCards size={14} /> Verilen Avans</div>
          <p className="text-2xl font-bold text-amber-600">{formatCurrency(summary?.totals.advances ?? 0)}</p>
        </div>
        <div className="card p-5">
          <div className="mb-1 text-sm text-gray-500">Kalan Maaş</div>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(summary?.totals.remaining ?? 0)}</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">İşçi</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Aylık Maaş</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Avans</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Kalan</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Avans Listesi</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activeRows.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-sm text-gray-500">Henüz işçi kaydı yok</td></tr>
              ) : (
                activeRows.map(row => (
                  <tr key={row.worker.id} className="align-top hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">{row.worker.name}</p>
                      <p className="text-xs text-gray-400">{row.period}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="ml-auto flex max-w-[180px] items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          className="input text-right"
                          value={salaryDrafts[row.worker.id] ?? ''}
                          onChange={event => setSalaryDrafts(prev => ({ ...prev, [row.worker.id]: event.target.value }))}
                        />
                        <button onClick={() => saveSalary(row)} disabled={submitting} className="btn btn-secondary !px-3 !py-2 text-xs">Kaydet</button>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-amber-600">{formatCurrency(row.advanceTotal)}</td>
                    <td className={`px-5 py-4 text-right font-semibold ${row.remainingSalary >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatCurrency(row.remainingSalary)}
                    </td>
                    <td className="px-5 py-4">
                      {row.advances.length === 0 ? (
                        <span className="text-sm text-gray-400">Avans yok</span>
                      ) : (
                        <div className="space-y-2">
                          {row.advances.map(advance => (
                            <div key={advance.id} className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-gray-100">
                              <div>
                                <p className="font-medium text-gray-900">{formatCurrency(advance.amount)}</p>
                                <p className="text-xs text-gray-500">{formatDate(advance.paidAt)}{advance.note ? ` - ${advance.note}` : ''}</p>
                              </div>
                              <button onClick={() => deleteAdvance(advance.id)} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={() => openAdvance(row)} className="btn btn-primary !px-3 !py-2 text-xs">
                        <Plus size={14} /> Avans
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showWorkerForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">İşçi Ekle</h3>
              <button onClick={() => setShowWorkerForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={createWorker} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">İşçi Adı</label>
                <input className="input" value={workerForm.name} onChange={event => setWorkerForm({ ...workerForm, name: event.target.value })} required />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Varsayılan Aylık Maaş</label>
                <input type="number" step="0.01" className="input" value={workerForm.monthlySalary} onChange={event => setWorkerForm({ ...workerForm, monthlySalary: event.target.value })} required />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowWorkerForm(false)} className="btn btn-secondary flex-1">İptal</button>
                <button type="submit" disabled={submitting} className="btn btn-primary flex-1">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {advanceWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Avans Ekle</h3>
                <p className="text-sm text-gray-500">{advanceWorker.worker.name}</p>
              </div>
              <button onClick={() => setAdvanceWorker(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={addAdvance} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Avans Tutarı</label>
                <input type="number" step="0.01" className="input" value={advanceForm.amount} onChange={event => setAdvanceForm({ ...advanceForm, amount: event.target.value })} required />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Ödeme Tarihi</label>
                <input type="date" className="input" value={advanceForm.paidAt} onChange={event => setAdvanceForm({ ...advanceForm, paidAt: event.target.value })} required />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Not</label>
                <input className="input" value={advanceForm.note} onChange={event => setAdvanceForm({ ...advanceForm, note: event.target.value })} placeholder="İsteğe bağlı" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setAdvanceWorker(null)} className="btn btn-secondary flex-1">İptal</button>
                <button type="submit" disabled={submitting} className="btn btn-primary flex-1">Avans Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
