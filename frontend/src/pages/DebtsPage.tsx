import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Plus, X, Trash2, CheckCircle, Clock, Download, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Fix TS for jspdf-autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface Debt {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: 'pending' | 'paid';
  creditor: string;
  createdAt: string;
}

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', amount: '', dueDate: '', creditor: ''
  });

  const fetchData = async () => {
    try {
      const { data } = await api.get('/api/debts');
      setDebts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/debts', form);
      setShowForm(false);
      setForm({ title: '', description: '', amount: '', dueDate: '', creditor: '' });
      fetchData();
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.patch(`/api/debts/${id}/status`, { status });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu borç kaydını silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/api/debts/${id}`);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const formatCurrency = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n);
  const formatDate = (d: string) => new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });

  const handleExportExcel = () => {
    const exportData = debts.map(d => ({
      'Başlık': d.title,
      'Alacaklı (Cari)': d.creditor,
      'Açıklama': d.description || '-',
      'Vade': formatDate(d.dueDate),
      'Tutar (TL)': d.amount,
      'Durum': d.status === 'paid' ? 'Ödendi' : 'Bekliyor'
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cari_Borclar');
    XLSX.writeFile(workbook, `Cari_Borclar_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '_')}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text('Cari Borçlar Listesi', 14, 15);
    
    const tableData = debts.map(d => [
      d.title,
      d.creditor,
      formatDate(d.dueDate),
      formatCurrency(d.amount),
      d.status === 'paid' ? 'Odendi' : 'Bekliyor'
    ]);

    doc.autoTable({
      head: [['Baslik', 'Alacakli', 'Vade', 'Tutar', 'Durum']],
      body: tableData,
      startY: 20,
      styles: { font: 'helvetica' },
    });
    
    doc.save(`Cari_Borclar_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '_')}.pdf`);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" /></div>;

  const totalPending = debts.filter(d => d.status === 'pending').reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cari Borçlar</h1>
          <p className="text-gray-500 text-sm mt-1">Tedarikçilere ve carilere olan borçlarınız</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportPDF} className="btn btn-secondary bg-white border border-gray-200 text-gray-700 hover:bg-gray-50">
            <FileText size={16} /> PDF
          </button>
          <button onClick={handleExportExcel} className="btn btn-secondary bg-white border border-gray-200 text-gray-700 hover:bg-gray-50">
            <Download size={16} /> Excel
          </button>
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            <Plus size={16} /> Yeni Borç Ekle
          </button>
        </div>
      </div>

      <div className="card p-5 border-l-4 border-l-red-500">
        <p className="text-sm text-gray-500 mb-1">Toplam Bekleyen Borç</p>
        <p className="text-2xl font-bold text-red-600">{formatCurrency(totalPending)}</p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Başlık</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Alacaklı (Cari)</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Açıklama</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Vade</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase px-5 py-3">Tutar</th>
                <th className="text-center text-xs font-semibold text-gray-500 uppercase px-5 py-3">Durum</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase px-5 py-3">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {debts.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-sm text-gray-500 py-8">Kayıtlı borç bulunmuyor</td></tr>
              ) : (
                debts.map(debt => (
                  <tr key={debt.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{debt.title}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{debt.creditor}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500 max-w-xs truncate" title={debt.description}>{debt.description || '-'}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className={new Date(debt.dueDate) < new Date() && debt.status === 'pending' ? 'text-red-500' : 'text-gray-400'} />
                        <span className={new Date(debt.dueDate) < new Date() && debt.status === 'pending' ? 'text-red-600 font-medium' : ''}>
                          {formatDate(debt.dueDate)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-red-600 text-right">{formatCurrency(debt.amount)}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        debt.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {debt.status === 'paid' ? <CheckCircle size={12} /> : <Clock size={12} />}
                        {debt.status === 'paid' ? 'Ödendi' : 'Bekliyor'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {debt.status === 'pending' && (
                          <button onClick={() => handleStatusChange(debt.id, 'paid')} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium bg-emerald-50 px-2 py-1 rounded">
                            Ödendi İşaretle
                          </button>
                        )}
                        {debt.status === 'paid' && (
                          <button onClick={() => handleStatusChange(debt.id, 'pending')} className="text-xs text-amber-600 hover:text-amber-700 font-medium bg-amber-50 px-2 py-1 rounded">
                            Geri Al
                          </button>
                        )}
                        <button onClick={() => handleDelete(debt.id)} className="text-red-500 hover:text-red-700 p-1">
                          <Trash2 size={16} />
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

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Yeni Borç Ekle</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Başlık</label>
                <input type="text" className="input" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Alacaklı (Cari)</label>
                <input type="text" className="input" required value={form.creditor} onChange={e => setForm({...form, creditor: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tutar (₺)</label>
                  <input type="number" step="0.01" className="input" required value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Vade Tarihi</label>
                  <input type="date" className="input" required value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Açıklama</label>
                <textarea className="input min-h-[80px]" value={form.description} onChange={e => setForm({...form, description: e.target.value})}></textarea>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary flex-1">İptal</button>
                <button type="submit" disabled={submitting} className="btn btn-primary flex-1">
                  {submitting ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
