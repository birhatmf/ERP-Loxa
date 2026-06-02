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

interface Receivable {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: 'pending' | 'collected';
  debtor: string;
  createdAt: string;
}

export default function ReceivablesPage() {
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', amount: '', dueDate: '', debtor: ''
  });

  const fetchData = async () => {
    try {
      const { data } = await api.get('/api/receivables');
      setReceivables(data);
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
      await api.post('/api/receivables', form);
      setShowForm(false);
      setForm({ title: '', description: '', amount: '', dueDate: '', debtor: '' });
      fetchData();
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.patch(`/api/receivables/${id}/status`, { status });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu alacak kaydını silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/api/receivables/${id}`);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const formatCurrency = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n);
  const formatDate = (d: string) => new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });

  const handleExportExcel = () => {
    const exportData = receivables.map(r => ({
      'Başlık': r.title,
      'Borçlu (Cari)': r.debtor,
      'Açıklama': r.description || '-',
      'Vade': formatDate(r.dueDate),
      'Tutar (TL)': r.amount,
      'Durum': r.status === 'collected' ? 'Tahsil Edildi' : 'Bekliyor'
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cari_Alacaklar');
    XLSX.writeFile(workbook, `Cari_Alacaklar_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '_')}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Using a basic font config to avoid Turkish char issues if possible, 
    // but default Helvetica may miss some TR chars. It's acceptable for a quick ERP export.
    doc.text('Cari Alacaklar Listesi', 14, 15);
    
    const tableData = receivables.map(r => [
      r.title,
      r.debtor,
      formatDate(r.dueDate),
      formatCurrency(r.amount),
      r.status === 'collected' ? 'Tahsil Edildi' : 'Bekliyor'
    ]);

    doc.autoTable({
      head: [['Baslik', 'Borclu', 'Vade', 'Tutar', 'Durum']],
      body: tableData,
      startY: 20,
      styles: { font: 'helvetica' },
    });
    
    doc.save(`Cari_Alacaklar_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '_')}.pdf`);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" /></div>;

  const totalPending = receivables.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cari Alacaklar</h1>
          <p className="text-gray-500 text-sm mt-1">Müşteri ve carilerden tahsil edilecek tutarlar</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportPDF} className="btn btn-secondary bg-white border border-gray-200 text-gray-700 hover:bg-gray-50">
            <FileText size={16} /> PDF
          </button>
          <button onClick={handleExportExcel} className="btn btn-secondary bg-white border border-gray-200 text-gray-700 hover:bg-gray-50">
            <Download size={16} /> Excel
          </button>
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            <Plus size={16} /> Yeni Alacak Ekle
          </button>
        </div>
      </div>

      <div className="card p-5 border-l-4 border-l-emerald-500">
        <p className="text-sm text-gray-500 mb-1">Toplam Bekleyen Tahsilat</p>
        <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalPending)}</p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Başlık</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Borçlu (Cari)</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Açıklama</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Vade</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase px-5 py-3">Tutar</th>
                <th className="text-center text-xs font-semibold text-gray-500 uppercase px-5 py-3">Durum</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase px-5 py-3">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {receivables.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-sm text-gray-500 py-8">Kayıtlı alacak bulunmuyor</td></tr>
              ) : (
                receivables.map(rec => (
                  <tr key={rec.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{rec.title}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{rec.debtor}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500 max-w-xs truncate" title={rec.description}>{rec.description || '-'}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className={new Date(rec.dueDate) < new Date() && rec.status === 'pending' ? 'text-red-500' : 'text-gray-400'} />
                        <span className={new Date(rec.dueDate) < new Date() && rec.status === 'pending' ? 'text-red-600 font-medium' : ''}>
                          {formatDate(rec.dueDate)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-emerald-600 text-right">{formatCurrency(rec.amount)}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        rec.status === 'collected' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {rec.status === 'collected' ? <CheckCircle size={12} /> : <Clock size={12} />}
                        {rec.status === 'collected' ? 'Tahsil Edildi' : 'Bekliyor'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {rec.status === 'pending' && (
                          <button onClick={() => handleStatusChange(rec.id, 'collected')} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium bg-emerald-50 px-2 py-1 rounded">
                            Tahsil Edildi İşaretle
                          </button>
                        )}
                        {rec.status === 'collected' && (
                          <button onClick={() => handleStatusChange(rec.id, 'pending')} className="text-xs text-amber-600 hover:text-amber-700 font-medium bg-amber-50 px-2 py-1 rounded">
                            Geri Al
                          </button>
                        )}
                        <button onClick={() => handleDelete(rec.id)} className="text-red-500 hover:text-red-700 p-1">
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
              <h3 className="text-lg font-semibold text-gray-900">Yeni Alacak Ekle</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Başlık</label>
                <input type="text" className="input" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Borçlu (Cari)</label>
                <input type="text" className="input" required value={form.debtor} onChange={e => setForm({...form, debtor: e.target.value})} />
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
