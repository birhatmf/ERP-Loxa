import React, { useEffect, useState } from 'react';
import api from '../api/client';
import type { Invoice } from '../types';
import { Plus, FileText, X, Check } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  pending: { label: 'Bekliyor', class: 'badge-yellow' },
  paid: { label: 'Ödendi', class: 'badge-green' },
  overdue: { label: 'Gecikmiş', class: 'badge-red' },
  cancelled: { label: 'İptal', class: 'badge-gray' },
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [form, setForm] = useState({
    projectId: '', customerId: '', dueDate: '',
    items: [{ description: '', quantity: '1', unitPrice: '', vatRate: '18' }],
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchInvoices = async () => {
    const { data } = await api.get('/api/invoices');
    setInvoices(data);
    setLoading(false);
  };

  useEffect(() => { fetchInvoices(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/invoices', {
        projectId: form.projectId || undefined,
        customerId: form.customerId || undefined,
        dueDate: form.dueDate,
        items: form.items.map(i => ({
          description: i.description,
          quantity: parseFloat(i.quantity),
          unitPrice: parseFloat(i.unitPrice),
          vatRate: parseFloat(i.vatRate),
        })),
      });
      setShowForm(false);
      setForm({ projectId: '', customerId: '', dueDate: '', items: [{ description: '', quantity: '1', unitPrice: '', vatRate: '18' }] });
      fetchInvoices();
    } finally { setSubmitting(false); }
  };

  const handlePay = async (id: string) => {
    await api.patch(`/api/invoices/${id}/pay`);
    fetchInvoices();
    if (selectedInvoice?.id === id) {
      const { data } = await api.get(`/api/invoices/${id}`);
      setSelectedInvoice(data);
    }
  };

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { description: '', quantity: '1', unitPrice: '', vatRate: '18' }] });
  };

  const removeItem = (idx: number) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  };

  const updateItem = (idx: number, field: string, value: string) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: value };
    setForm({ ...form, items });
  };

  const formatCurrency = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n);
  const formatDate = (d: string) => new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Faturalar</h1>
          <p className="text-gray-500 text-sm mt-1">Fatura oluşturma ve takip</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          <Plus size={16} /> Yeni Fatura
        </button>
      </div>

      {/* Invoices Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Fatura No</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Durum</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Vade</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Tutar</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">KDV</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Genel Toplam</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-sm text-gray-500 py-8">
                  <FileText size={32} className="mx-auto text-gray-300 mb-3" />
                  Henüz fatura bulunmuyor
                </td></tr>
              ) : (
                invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={async () => {
                    const { data } = await api.get(`/api/invoices/${inv.id}`);
                    setSelectedInvoice(data);
                  }}>
                    <td className="px-5 py-4 text-sm font-medium text-gray-900">{inv.invoiceNumber}</td>
                    <td className="px-5 py-4">
                      <span className={`badge ${STATUS_MAP[inv.status]?.class || 'badge-gray'}`}>
                        {STATUS_MAP[inv.status]?.label || inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{formatDate(inv.dueDate)}</td>
                    <td className="px-5 py-4 text-sm text-gray-600 text-right">{formatCurrency(inv.totalAmount)}</td>
                    <td className="px-5 py-4 text-sm text-gray-600 text-right">{formatCurrency(inv.vatAmount)}</td>
                    <td className="px-5 py-4 text-sm font-bold text-gray-900 text-right">{formatCurrency(inv.grandTotal)}</td>
                    <td className="px-5 py-4 text-right">
                      {inv.status === 'pending' && (
                        <button onClick={(e) => { e.stopPropagation(); handlePay(inv.id); }} className="btn btn-success !px-3 !py-1.5 text-xs">
                          <Check size={12} /> Öde
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-lg p-6 max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">{selectedInvoice.invoiceNumber}</h3>
              <button onClick={() => setSelectedInvoice(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Durum</span>
                <span className={`badge ${STATUS_MAP[selectedInvoice.status]?.class || 'badge-gray'}`}>
                  {STATUS_MAP[selectedInvoice.status]?.label || selectedInvoice.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Vade Tarihi</span>
                <span className="text-sm font-medium">{formatDate(selectedInvoice.dueDate)}</span>
              </div>
              {selectedInvoice.items && selectedInvoice.items.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Kalemler</h4>
                  <div className="space-y-2">
                    {selectedInvoice.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.description}</p>
                          <p className="text-xs text-gray-500">{item.quantity} × {formatCurrency(item.unitPrice)} (KDV %{item.vatRate})</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.totalPrice)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Ara Toplam</span>
                  <span>{formatCurrency(selectedInvoice.totalAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">KDV</span>
                  <span>{formatCurrency(selectedInvoice.vatAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-base font-bold">
                  <span>Genel Toplam</span>
                  <span>{formatCurrency(selectedInvoice.grandTotal)}</span>
                </div>
              </div>
              {selectedInvoice.status === 'pending' && (
                <button onClick={() => handlePay(selectedInvoice.id)} className="btn btn-success w-full mt-2">
                  <Check size={16} /> Ödendi Olarak İşaretle
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-lg p-6 max-h-[85vh] overflow-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Yeni Fatura</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Proje ID</label>
                  <input type="text" className="input" placeholder="Opsiyonel" value={form.projectId} onChange={e => setForm({...form, projectId: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Vade Tarihi</label>
                  <input type="date" className="input" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} required />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Fatura Kalemleri</label>
                  <button type="button" onClick={addItem} className="text-brand-600 text-sm font-medium hover:text-brand-700">+ Kalem Ekle</button>
                </div>
                <div className="space-y-3">
                  {form.items.map((item, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">Kalem {idx + 1}</span>
                        {form.items.length > 1 && (
                          <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600"><X size={14} /></button>
                        )}
                      </div>
                      <input type="text" className="input text-sm" placeholder="Açıklama" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} required />
                      <div className="grid grid-cols-3 gap-2">
                        <input type="number" step="0.01" className="input text-sm" placeholder="Adet" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} required />
                        <input type="number" step="0.01" className="input text-sm" placeholder="Birim Fiyat" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', e.target.value)} required />
                        <input type="number" step="0.01" className="input text-sm" placeholder="KDV %" value={item.vatRate} onChange={e => updateItem(idx, 'vatRate', e.target.value)} required />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary flex-1">İptal</button>
                <button type="submit" disabled={submitting} className="btn btn-primary flex-1">
                  {submitting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
