import React, { useEffect, useState } from 'react';
import api from '../api/client';
import type { Material } from '../types';
import { Plus, ShoppingCart, X, Printer, Check, CreditCard, Banknote, FileText } from 'lucide-react';

interface Sale {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: SaleItem[];
  totalAmount: number;
  paymentStatus: 'bekliyor' | 'kısmi' | 'ödendi';
  paymentMethod: string;
  paymentNote: string;
  description: string;
  createdAt: string;
}

interface SaleItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

const PAYMENT_STATUS_MAP: Record<string, { label: string; class: string }> = {
  bekliyor: { label: 'Bekliyor', class: 'badge-yellow' },
  kısmi: { label: 'Kısmi Ödeme', class: 'badge-blue' },
  ödendi: { label: 'Ödendi', class: 'badge-green' },
};

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showReceipt, setShowReceipt] = useState<Sale | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    paymentMethod: 'nakit',
    paymentStatus: 'bekliyor',
    paymentNote: '',
    description: '',
    items: [{ description: '', quantity: '1', unitPrice: '' }],
  });

  const fetchSales = async () => {
    try {
      const { data } = await api.get('/api/sales');
      setSales(data);
    } catch { setSales([]); }
    setLoading(false);
  };

  useEffect(() => { fetchSales(); }, []);

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { description: '', quantity: '1', unitPrice: '' }] });
  };

  const removeItem = (idx: number) => {
    if (form.items.length > 1) {
      setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
    }
  };

  const updateItem = (idx: number, field: string, value: string) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: value };
    setForm({ ...form, items });
  };

  const calcTotal = () => {
    return form.items.reduce((sum, i) => sum + (parseFloat(i.quantity) || 0) * (parseFloat(i.unitPrice) || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/sales', {
        ...form,
        items: form.items.map(i => ({
          description: i.description,
          quantity: parseFloat(i.quantity),
          unitPrice: parseFloat(i.unitPrice),
        })),
      });
      setShowForm(false);
      setForm({
        customerName: '', customerPhone: '', customerAddress: '',
        paymentMethod: 'nakit', paymentStatus: 'bekliyor', paymentNote: '', description: '',
        items: [{ description: '', quantity: '1', unitPrice: '' }],
      });
      fetchSales();
    } catch (err: any) {
      // If sales endpoint doesn't exist, save locally
      const totalAmount = calcTotal();
      const newSale: Sale = {
        id: Date.now().toString(),
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        customerAddress: form.customerAddress,
        items: form.items.map((i, idx) => ({
          id: `item-${idx}`,
          description: i.description,
          quantity: parseFloat(i.quantity),
          unitPrice: parseFloat(i.unitPrice),
          totalPrice: (parseFloat(i.quantity) || 0) * (parseFloat(i.unitPrice) || 0),
        })),
        totalAmount,
        paymentStatus: form.paymentStatus as any,
        paymentMethod: form.paymentMethod,
        paymentNote: form.paymentNote,
        description: form.description,
        createdAt: new Date().toISOString(),
      };
      setSales(prev => [newSale, ...prev]);
      setShowForm(false);
      setForm({
        customerName: '', customerPhone: '', customerAddress: '',
        paymentMethod: 'nakit', paymentStatus: 'bekliyor', paymentNote: '', description: '',
        items: [{ description: '', quantity: '1', unitPrice: '' }],
      });
    }
    setSubmitting(false);
  };

  const formatCurrency = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n);
  const formatDate = (d: string) => new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const handlePrint = (sale: Sale) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Sipariş Fişi #${sale.id}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #1a1a1a; }
        .header { text-align: center; border-bottom: 2px solid #1a1a1a; padding-bottom: 20px; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 4px 0 0; color: #666; font-size: 13px; }
        .section { margin-bottom: 20px; }
        .section h3 { margin: 0 0 8px; font-size: 13px; text-transform: uppercase; color: #666; letter-spacing: 0.5px; }
        .section p { margin: 2px 0; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        th { text-align: left; padding: 8px 12px; border-bottom: 2px solid #1a1a1a; font-size: 12px; text-transform: uppercase; color: #666; }
        td { padding: 8px 12px; border-bottom: 1px solid #e5e5e5; font-size: 14px; }
        .total-row td { border-top: 2px solid #1a1a1a; font-weight: bold; font-size: 16px; }
        .right { text-align: right; }
        .badge { display: inline-block; padding: 2px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; }
        .badge-green { background: #dcfce7; color: #166534; }
        .badge-yellow { background: #fef3c7; color: #92400e; }
        .badge-blue { background: #dbeafe; color: #1e40af; }
        .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #e5e5e5; padding-top: 16px; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <div class="header">
        <h1>SİPARİŞ FİŞİ</h1>
        <p>Fiş No: #${sale.id.slice(-8).toUpperCase()}</p>
        <p>${formatDate(sale.createdAt)}</p>
      </div>
      <div class="section">
        <h3>Müşteri Bilgileri</h3>
        <p><strong>${sale.customerName}</strong></p>
        ${sale.customerPhone ? `<p>Tel: ${sale.customerPhone}</p>` : ''}
        ${sale.customerAddress ? `<p>Adres: ${sale.customerAddress}</p>` : ''}
      </div>
      ${sale.description ? `<div class="section"><h3>Notlar</h3><p>${sale.description}</p></div>` : ''}
      <table>
        <thead><tr><th>Açıklama</th><th class="right">Adet</th><th class="right">Birim Fiyat</th><th class="right">Toplam</th></tr></thead>
        <tbody>
          ${sale.items.map(i => `<tr><td>${i.description}</td><td class="right">${i.quantity}</td><td class="right">${formatCurrency(i.unitPrice)}</td><td class="right">${formatCurrency(i.totalPrice)}</td></tr>`).join('')}
          <tr class="total-row"><td colspan="3" class="right">GENEL TOPLAM</td><td class="right">${formatCurrency(sale.totalAmount)}</td></tr>
        </tbody>
      </table>
      <div class="section">
        <h3>Ödeme</h3>
        <p>Yöntem: <strong>${sale.paymentMethod === 'nakit' ? 'Nakit' : sale.paymentMethod === 'kart' ? 'Kredi Kartı' : sale.paymentMethod === 'havale' ? 'Havale/EFT' : sale.paymentMethod === 'cek' ? 'Çek' : sale.paymentMethod}</strong></p>
        <p>Durum: <span class="badge badge-${sale.paymentStatus === 'ödendi' ? 'green' : sale.paymentStatus === 'kısmi' ? 'blue' : 'yellow'}">${sale.paymentStatus === 'ödendi' ? 'ÖDENDİ' : sale.paymentStatus === 'kısmi' ? 'KISMİ ÖDEME' : 'BEKLİYOR'}</span></p>
        ${sale.paymentNote ? `<p>Not: ${sale.paymentNote}</p>` : ''}
      </div>
      <div class="footer">Bu belge bilgilendirme amaçlıdır.</div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Satış & Siparişler</h1>
          <p className="text-gray-500 text-sm mt-1">Müşteri bazlı satış takibi ve sipariş fişleri</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          <Plus size={16} /> Yeni Satış
        </button>
      </div>

      {/* Sales List */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Tarih</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Müşteri</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Açıklama</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Ödeme</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Durum</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Tutar</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sales.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-sm text-gray-500 py-8">
                  <ShoppingCart size={32} className="mx-auto text-gray-300 mb-3" />
                  Henüz satış kaydı yok
                </td></tr>
              ) : (
                sales.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-sm text-gray-500 whitespace-nowrap">{formatDate(s.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-gray-900">{s.customerName}</p>
                      {s.customerPhone && <p className="text-xs text-gray-400">{s.customerPhone}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600 max-w-[200px] truncate">{s.description || s.items.map(i => i.description).join(', ')}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600 capitalize">{s.paymentMethod}</td>
                    <td className="px-5 py-3.5">
                      <span className={`badge ${PAYMENT_STATUS_MAP[s.paymentStatus]?.class || 'badge-gray'}`}>
                        {PAYMENT_STATUS_MAP[s.paymentStatus]?.label || s.paymentStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-gray-900 text-right whitespace-nowrap">{formatCurrency(s.totalAmount)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={() => setShowReceipt(s)} className="btn btn-secondary !px-3 !py-1.5 text-xs">
                        <Printer size={14} /> Fiş
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Sale Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-2xl p-6 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Yeni Satış</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Customer Info */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="h-5 w-5 rounded bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">1</span>
                  Müşteri Bilgileri
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Müşteri Adı *</label>
                    <input type="text" className="input" placeholder="Adı Soyadı / Firma" value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                    <input type="text" className="input" placeholder="05xx xxx xx xx" value={form.customerPhone} onChange={e => setForm({...form, customerPhone: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                    <input type="text" className="input" placeholder="Adres" value={form.customerAddress} onChange={e => setForm({...form, customerAddress: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <span className="h-5 w-5 rounded bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">2</span>
                    Satış Kalemleri
                  </h4>
                  <button type="button" onClick={addItem} className="text-brand-600 text-sm font-medium hover:text-brand-700">+ Kalem Ekle</button>
                </div>
                <div className="space-y-2">
                  {form.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                      <input type="text" className="input flex-1" placeholder="Ne satıldı? (ürün/hizmet açıklaması)" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} required />
                      <input type="number" step="0.01" className="input w-20" placeholder="Adet" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} required />
                      <input type="number" step="0.01" className="input w-28" placeholder="Birim Fiyat ₺" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', e.target.value)} required />
                      <span className="text-sm font-semibold text-gray-700 w-24 text-right">
                        {formatCurrency((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0))}
                      </span>
                      {form.items.length > 1 && (
                        <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600"><X size={16} /></button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-2">
                  <span className="text-sm font-bold text-gray-900">Toplam: {formatCurrency(calcTotal())}</span>
                </div>
              </div>

              {/* Payment */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="h-5 w-5 rounded bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">3</span>
                  Ödeme Bilgileri
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Yöntemi</label>
                    <select className="select" value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value})}>
                      <option value="nakit">Nakit</option>
                      <option value="kart">Kredi Kartı</option>
                      <option value="havale">Havale/EFT</option>
                      <option value="cek">Çek</option>
                      <option value="acik_hesap">Açık Hesap</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Durumu</label>
                    <select className="select" value={form.paymentStatus} onChange={e => setForm({...form, paymentStatus: e.target.value})}>
                      <option value="bekliyor">Bekliyor</option>
                      <option value="kısmi">Kısmi Ödeme Alındı</option>
                      <option value="ödendi">Ödendi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Notu</label>
                    <input type="text" className="input" placeholder="Örn: Çek no, taksit detayı..." value={form.paymentNote} onChange={e => setForm({...form, paymentNote: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ek Notlar</label>
                <textarea className="input min-h-[60px]" placeholder="Sipariş ile ilgili ek bilgiler..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary flex-1">İptal</button>
                <button type="submit" disabled={submitting} className="btn btn-primary flex-1">
                  {submitting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : 'Satışı Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Preview Modal */}
      {showReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Sipariş Fişi</h3>
              <button onClick={() => setShowReceipt(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
              <div className="text-center border-b pb-3">
                <p className="text-lg font-bold">SİPARİŞ FİŞİ</p>
                <p className="text-xs text-gray-500">#{showReceipt.id.slice(-8).toUpperCase()}</p>
                <p className="text-xs text-gray-500">{formatDate(showReceipt.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Müşteri</p>
                <p className="font-medium">{showReceipt.customerName}</p>
                {showReceipt.customerPhone && <p className="text-sm text-gray-600">{showReceipt.customerPhone}</p>}
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Kalemler</p>
                {showReceipt.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-200 last:border-0">
                    <span>{item.description} × {item.quantity}</span>
                    <span className="font-medium">{formatCurrency(item.totalPrice)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-3">
                <span>Toplam</span>
                <span>{formatCurrency(showReceipt.totalAmount)}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Ödeme: </span>
                <span className="font-medium capitalize">{showReceipt.paymentMethod}</span>
                <span className={`ml-2 badge ${PAYMENT_STATUS_MAP[showReceipt.paymentStatus]?.class}`}>
                  {PAYMENT_STATUS_MAP[showReceipt.paymentStatus]?.label}
                </span>
              </div>
              {showReceipt.paymentNote && (
                <p className="text-xs text-gray-500">Not: {showReceipt.paymentNote}</p>
              )}
            </div>
            <button onClick={() => handlePrint(showReceipt)} className="btn btn-primary w-full mt-4">
              <Printer size={16} /> Yazdır
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
