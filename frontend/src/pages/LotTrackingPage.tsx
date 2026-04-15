import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Plus, Hash, X, QrCode, Search } from 'lucide-react';

interface LotRecord {
  id: string;
  materialId: string;
  materialName: string;
  lotNumber: string;
  serialNumber: string;
  quantity: number;
  supplierId: string;
  supplierName: string;
  receivedDate: string;
  expiryDate: string;
  notes: string;
}

export default function LotTrackingPage() {
  const [lots, setLots] = useState<LotRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    materialId: '', lotNumber: '', serialNumber: '',
    quantity: '', supplierId: '', expiryDate: '', notes: '',
  });

  const fetchData = async () => {
    try {
      const { data } = await api.get('/api/inventory/lots');
      setLots(data);
    } catch { setLots([]); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/inventory/lots', { ...form, quantity: parseFloat(form.quantity) });
      fetchData();
    } catch {
      setLots(prev => [{
        id: Date.now().toString(),
        ...form,
        quantity: parseFloat(form.quantity),
        materialName: '',
        supplierName: '',
        receivedDate: new Date().toISOString(),
      }, ...prev]);
    }
    setShowForm(false);
    setForm({ materialId: '', lotNumber: '', serialNumber: '', quantity: '', supplierId: '', expiryDate: '', notes: '' });
    setSubmitting(false);
  };

  const generateLot = () => {
    const prefix = 'LOT';
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.random().toString(36).substr(2, 4).toUpperCase();
    setForm({ ...form, lotNumber: `${prefix}-${date}-${rand}` });
  };

  const generateSerial = () => {
    const prefix = 'SN';
    const timestamp = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substr(2, 4).toUpperCase();
    setForm({ ...form, serialNumber: `${prefix}-${timestamp}-${rand}` });
  };

  const filtered = search
    ? lots.filter(l => l.lotNumber?.toLowerCase().includes(search.toLowerCase()) || l.serialNumber?.toLowerCase().includes(search.toLowerCase()) || l.materialName?.toLowerCase().includes(search.toLowerCase()))
    : lots;

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
  const isExpired = (d: string) => d && new Date(d) < new Date();
  const isExpiringSoon = (d: string) => {
    if (!d) return false;
    const days = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
    return days > 0 && days <= 30;
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lot & Seri Numarası Takibi</h1>
          <p className="text-gray-500 text-sm mt-1">Parti bazlı malzeme izlenebilirliği</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          <Plus size={16} /> Yeni Kayıt
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" className="input pl-9" placeholder="Lot, seri no veya malzeme ara..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Lot No</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Seri No</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Malzeme</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Tedarikçi</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Miktar</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Alış Tarihi</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">SKT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-sm text-gray-500 py-8">
                  <Hash size={32} className="mx-auto text-gray-300 mb-3" />
                  {search ? 'Aramaya uygun kayıt bulunamadı' : 'Henüz lot/seri kaydı yok'}
                </td></tr>
              ) : (
                filtered.map(lot => (
                  <tr key={lot.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-sm font-medium text-gray-900">{lot.lotNumber}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-sm text-gray-600">{lot.serialNumber || '-'}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-900">{lot.materialName}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{lot.supplierName || '-'}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-900 text-right font-medium">{lot.quantity}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{formatDate(lot.receivedDate)}</td>
                    <td className="px-5 py-3.5">
                      {lot.expiryDate ? (
                        <span className={`text-sm ${isExpired(lot.expiryDate) ? 'text-red-600 font-semibold' : isExpiringSoon(lot.expiryDate) ? 'text-amber-600 font-medium' : 'text-gray-500'}`}>
                          {formatDate(lot.expiryDate)}
                          {isExpired(lot.expiryDate) && ' ⚠ Süresi doldu'}
                          {isExpiringSoon(lot.expiryDate) && !isExpired(lot.expiryDate) && ' ⏳ Yaklaşıyor'}
                        </span>
                      ) : '-'}
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
              <h3 className="text-lg font-semibold text-gray-900">Yeni Lot/Seri Kaydı</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lot Numarası</label>
                <div className="flex gap-2">
                  <input type="text" className="input flex-1 font-mono" placeholder="LOT-XXXX" value={form.lotNumber} onChange={e => setForm({...form, lotNumber: e.target.value})} required />
                  <button type="button" onClick={generateLot} className="btn btn-secondary text-xs"><QrCode size={14} /> Oto</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seri Numarası</label>
                <div className="flex gap-2">
                  <input type="text" className="input flex-1 font-mono" placeholder="SN-XXXX (opsiyonel)" value={form.serialNumber} onChange={e => setForm({...form, serialNumber: e.target.value})} />
                  <button type="button" onClick={generateSerial} className="btn btn-secondary text-xs"><QrCode size={14} /> Oto</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Miktar</label>
                  <input type="number" step="0.01" className="input" placeholder="0" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Son Kullanma</label>
                  <input type="date" className="input" value={form.expiryDate} onChange={e => setForm({...form, expiryDate: e.target.value})} />
                </div>
              </div>
              <textarea className="input min-h-[50px]" placeholder="Notlar..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
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
