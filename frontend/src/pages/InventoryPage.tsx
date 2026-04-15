import React, { useEffect, useState } from 'react';
import api from '../api/client';
import type { Material, StockHistory } from '../types';
import { Plus, Package, AlertTriangle, X, History, Pencil, RefreshCw } from 'lucide-react';

export default function InventoryPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showStockForm, setShowStockForm] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [history, setHistory] = useState<StockHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [editingMovement, setEditingMovement] = useState<StockHistory | null>(null);
  const [form, setForm] = useState({ name: '', unit: 'adet', minStockLevel: '' });
  const [editForm, setEditForm] = useState({ name: '', unit: 'adet', minStockLevel: '', manualPrice: '' });
  const [movementForm, setMovementForm] = useState({ materialId: '', quantity: '', type: 'IN', description: '', date: '' });
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

  const openEditMaterial = (material: Material) => {
    setEditingMaterial(material);
    setEditForm({
      name: material.name,
      unit: material.unit,
      minStockLevel: String(material.minStockLevel),
      manualPrice: material.manualPrice !== undefined && material.manualPrice !== null ? String(material.manualPrice) : '',
    });
    setShowEditForm(true);
  };

  const handleUpdateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial) return;
    setSubmitting(true);
    try {
      await api.patch(`/api/inventory/materials/${editingMaterial.id}`, {
        name: editForm.name,
        unit: editForm.unit,
        minStockLevel: parseFloat(editForm.minStockLevel) || 0,
        manualPrice: editForm.manualPrice === '' ? null : parseFloat(editForm.manualPrice),
      });
      setShowEditForm(false);
      setEditingMaterial(null);
      fetchMaterials();
    } finally {
      setSubmitting(false);
    }
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

  const openMovementEdit = (movement: StockHistory) => {
    setEditingMovement(movement);
    setMovementForm({
      materialId: movement.materialId,
      quantity: String(movement.quantity),
      type: movement.type || 'IN',
      description: movement.description || '',
      date: movement.createdAt ? movement.createdAt.slice(0, 16) : '',
    });
  };

  const handleUpdateMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showHistory || !editingMovement) return;
    setSubmitting(true);
    try {
      await api.patch(`/api/inventory/materials/${showHistory}/history/${editingMovement.id}`, {
        materialId: movementForm.materialId,
        quantity: parseFloat(movementForm.quantity),
        type: movementForm.type,
        description: movementForm.description,
        date: movementForm.date ? new Date(movementForm.date).toISOString() : undefined,
        correctionReason: 'Stok hareketi düzeltildi',
      });
      setEditingMovement(null);
      await fetchMaterials();
      await openHistory(showHistory);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
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
                <div className="flex items-center gap-2">
                  {m.isLowStock && <span className="badge badge-red">Düşük</span>}
                  <button onClick={() => openEditMaterial(m)} className="btn btn-secondary !px-3 !py-2 text-xs">
                    <Pencil size={14} />
                  </button>
                </div>
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

              <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-gray-50 p-3">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Güncel Fiyat</p>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    {formatCurrency(m.currentPrice)}
                    {m.manualPrice !== undefined && m.manualPrice !== null && (
                      <span className="badge badge-blue text-[10px]">Manuel</span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-0.5">Toplam Değer</p>
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(m.totalValue)}</p>
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

      {/* Edit Material Modal */}
      {showEditForm && editingMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Malzemeyi Düzenle</h3>
              <button onClick={() => { setShowEditForm(false); setEditingMaterial(null); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdateMaterial} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Malzeme Adı</label>
                <input type="text" className="input" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Birim</label>
                  <select className="select" value={editForm.unit} onChange={e => setEditForm({...editForm, unit: e.target.value})}>
                    <option value="adet">Adet</option>
                    <option value="m2">m²</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Min. Stok Seviyesi</label>
                  <input type="number" className="input" value={editForm.minStockLevel} onChange={e => setEditForm({...editForm, minStockLevel: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Güncel Fiyat (manuel)</label>
                <input type="number" step="0.01" className="input" placeholder="Boş bırakırsan son satın alma fiyatı kullanılır" value={editForm.manualPrice} onChange={e => setEditForm({...editForm, manualPrice: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowEditForm(false); setEditingMaterial(null); }} className="btn btn-secondary flex-1">İptal</button>
                <button type="submit" disabled={submitting} className="btn btn-primary flex-1">
                  {submitting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : 'Kaydet'}
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
                  <div key={h.id} className={`flex items-center justify-between p-3 rounded-lg border ${h.isCorrection ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-transparent'}`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium ${h.isCorrection ? 'text-red-700' : 'text-gray-900'}`}>
                          {h.description || 'Stok hareketi'}
                        </p>
                        {h.isCorrection && <span className="badge badge-red text-[10px]">Düzeltme</span>}
                      </div>
                      <p className="text-xs text-gray-500">{new Date(h.createdAt).toLocaleString('tr-TR')}</p>
                      {h.correctionReason && (
                        <p className="text-xs text-red-600 mt-1">{h.correctionReason}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${h.isCorrection ? 'text-red-700' : h.type === 'OUT' ? 'text-red-600' : 'text-emerald-600'}`}>
                        {h.type === 'OUT' ? '-' : '+'}{h.quantity}
                      </span>
                      <button onClick={() => openMovementEdit(h)} className="btn btn-secondary !px-2.5 !py-1.5 text-xs">
                        <Pencil size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Stock Movement Modal */}
      {editingMovement && showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Stok Hareketini Düzenle</h3>
              <button onClick={() => setEditingMovement(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdateMovement} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Malzeme</label>
                <select className="select" value={movementForm.materialId} onChange={e => setMovementForm({...movementForm, materialId: e.target.value})}>
                  {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tür</label>
                  <select className="select" value={movementForm.type} onChange={e => setMovementForm({...movementForm, type: e.target.value})}>
                    <option value="IN">Giriş</option>
                    <option value="OUT">Çıkış</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tarih</label>
                  <input type="datetime-local" className="input" value={movementForm.date} onChange={e => setMovementForm({...movementForm, date: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Miktar</label>
                <input type="number" step="0.01" className="input" value={movementForm.quantity} onChange={e => setMovementForm({...movementForm, quantity: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Açıklama</label>
                <input type="text" className="input" value={movementForm.description} onChange={e => setMovementForm({...movementForm, description: e.target.value})} />
              </div>
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 flex items-start gap-2">
                <RefreshCw size={14} className="mt-0.5 flex-shrink-0" />
                Bu işlem geçmişte kırmızı düzeltme olarak işaretlenir ve stok yeniden hesaplanır.
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingMovement(null)} className="btn btn-secondary flex-1">İptal</button>
                <button type="submit" disabled={submitting} className="btn btn-primary flex-1">
                  {submitting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : 'Düzelt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
