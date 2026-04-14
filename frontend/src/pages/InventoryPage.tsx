import React, { useEffect, useState } from 'react';
import api from '../api/client';
import type { Material, StockHistory } from '../types';
import { Plus, Package, AlertTriangle, X, History } from 'lucide-react';

export default function InventoryPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showStockForm, setShowStockForm] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [history, setHistory] = useState<StockHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [form, setForm] = useState({ name: '', unit: 'adet', minStockLevel: '' });
  const [stockForm, setStockForm] = useState({ quantity: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchMaterials = async () => {
    const { data } = await api.get('/api/inventory/materials');
    setMaterials(data);
    setLoading(false);
  };

  useEffect(() => { fetchMaterials(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/inventory/materials', { ...form, minStockLevel: parseFloat(form.minStockLevel) || 0 });
      setShowForm(false);
      setForm({ name: '', unit: 'adet', minStockLevel: '' });
      fetchMaterials();
    } finally { setSubmitting(false); }
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showStockForm) return;
    setSubmitting(true);
    try {
      await api.post(`/api/inventory/materials/${showStockForm}/stock`, { quantity: parseFloat(stockForm.quantity), description: stockForm.description });
      setShowStockForm(null);
      setStockForm({ quantity: '', description: '' });
      fetchMaterials();
    } finally { setSubmitting(false); }
  };

  const openHistory = async (id: string) => {
    setShowHistory(id);
    setHistoryLoading(true);
    try {
      const { data } = await api.get(`/api/inventory/materials/${id}/history`);
      setHistory(data);
    } catch { setHistory([]); }
    finally { setHistoryLoading(false); }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stok Yönetimi</h1>
          <p className="text-gray-500 text-sm mt-1">Malzeme ve stok takibi</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          <Plus size={16} /> Yeni Malzeme
        </button>
      </div>

      {/* Low Stock Alert Banner */}
      {materials.some(m => m.isLowStock) && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">
            <span className="font-semibold">{materials.filter(m => m.isLowStock).length} malzeme</span> kritik stok seviyesinin altında!
          </p>
        </div>
      )}

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {materials.length === 0 ? (
          <div className="card p-8 text-center col-span-full">
            <Package size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">Henüz malzeme eklenmemiş</p>
          </div>
        ) : (
          materials.map(m => (
            <div key={m.id} className={`card p-5 ${m.isLowStock ? 'ring-2 ring-red-200' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${m.isLowStock ? 'bg-red-50' : 'bg-brand-50'}`}>
                    <Package size={18} className={m.isLowStock ? 'text-red-600' : 'text-brand-600'} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{m.name}</h3>
                    <p className="text-xs text-gray-500 uppercase">{m.unit}</p>
                  </div>
                </div>
                {m.isLowStock && <span className="badge badge-red">Düşük</span>}
              </div>

              <div className="flex items-end justify-between mt-4">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Mevcut Stok</p>
                  <p className={`text-xl font-bold ${m.isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                    {m.currentStock} <span className="text-sm font-normal text-gray-400">{m.unit}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Min: {m.minStockLevel} {m.unit}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openHistory(m.id)} className="btn btn-secondary !px-3 !py-2 text-xs">
                    <History size={14} />
                  </button>
                  <button onClick={() => { setShowStockForm(m.id); setStockForm({ quantity: '', description: '' }); }} className="btn btn-primary !px-3 !py-2 text-xs">
                    <Plus size={14} /> Stok
                  </button>
                </div>
              </div>

              {/* Stock bar */}
              <div className="mt-3">
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${m.isLowStock ? 'bg-red-500' : 'bg-brand-500'}`}
                    style={{ width: `${Math.min(100, (m.currentStock / Math.max(m.minStockLevel, 1)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Material Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Yeni Malzeme</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Malzeme Adı</label>
                <input type="text" className="input" placeholder="Örn: MDF Panel 18mm" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Birim</label>
                  <select className="select" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}>
                    <option value="adet">Adet</option>
                    <option value="m2">m²</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Min. Stok Seviyesi</label>
                  <input type="number" className="input" placeholder="0" value={form.minStockLevel} onChange={e => setForm({...form, minStockLevel: e.target.value})} />
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

      {/* Add Stock Modal */}
      {showStockForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Stok Ekle</h3>
              <button onClick={() => setShowStockForm(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddStock} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Miktar</label>
                <input type="number" step="0.01" className="input" placeholder="0" value={stockForm.quantity} onChange={e => setStockForm({...stockForm, quantity: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Açıklama</label>
                <input type="text" className="input" placeholder="Neden stok ekleniyor?" value={stockForm.description} onChange={e => setStockForm({...stockForm, description: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowStockForm(null)} className="btn btn-secondary flex-1">İptal</button>
                <button type="submit" disabled={submitting} className="btn btn-primary flex-1">
                  {submitting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : 'Stok Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-lg p-6 max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Stok Geçmişi</h3>
              <button onClick={() => setShowHistory(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            {historyLoading ? (
              <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-3 border-brand-600 border-t-transparent" /></div>
            ) : history.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Geçmiş bulunmuyor</p>
            ) : (
              <div className="space-y-3">
                {history.map(h => (
                  <div key={h.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{h.description || 'Stok hareketi'}</p>
                      <p className="text-xs text-gray-500">{new Date(h.createdAt).toLocaleString('tr-TR')}</p>
                    </div>
                    <span className={`text-sm font-semibold ${h.quantity >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {h.quantity >= 0 ? '+' : ''}{h.quantity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
