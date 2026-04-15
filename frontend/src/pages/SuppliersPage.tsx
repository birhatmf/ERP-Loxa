import React, { useEffect, useState } from 'react';
import api from '../api/client';
import type { Material } from '../types';
import { Plus, Truck, X, Phone, Mail, MapPin, ShoppingCart, AlertTriangle, Pencil, Trash2 } from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  taxId: string;
  notes: string;
  totalOrders: number;
  createdAt: string;
  updatedAt: string;
}

interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  items: POItem[];
  totalAmount: number;
  status: 'draft' | 'sent' | 'confirmed' | 'received' | 'cancelled';
  expectedDate: string;
  receivedDate: string;
  description: string;
  createdAt: string;
}

interface POItem {
  id: string;
  materialId: string;
  materialName: string;
  quantity: number;
  unitPrice: number;
  receivedQty: number;
}

const PO_STATUS: Record<string, { label: string; class: string }> = {
  draft: { label: 'Taslak', class: 'badge-gray' },
  sent: { label: 'Gönderildi', class: 'badge-blue' },
  confirmed: { label: 'Onaylandı', class: 'badge-purple' },
  received: { label: 'Teslim Alındı', class: 'badge-green' },
  cancelled: { label: 'İptal', class: 'badge-red' },
};

export default function SuppliersPage() {
  const [tab, setTab] = useState<'suppliers' | 'orders'>('suppliers');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderStatusUpdating, setOrderStatusUpdating] = useState<string | null>(null);

  const [supplierForm, setSupplierForm] = useState({
    name: '', contactPerson: '', phone: '', email: '', address: '', taxId: '', notes: '',
  });
  const [orderForm, setOrderForm] = useState({
    supplierId: '', expectedDate: '', description: '',
    items: [{ materialId: '', quantity: '', unitPrice: '' }],
  });

  const resetOrderForm = () => {
    setOrderForm({ supplierId: '', expectedDate: '', description: '', items: [{ materialId: '', quantity: '', unitPrice: '' }] });
  };

  const resetSupplierForm = () => {
    setSupplierForm({ name: '', contactPerson: '', phone: '', email: '', address: '', taxId: '', notes: '' });
    setEditingSupplier(null);
  };

  const openCreateSupplier = () => {
    resetSupplierForm();
    setShowSupplierForm(true);
  };

  const openEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setSupplierForm({
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      taxId: supplier.taxId,
      notes: supplier.notes,
    });
    setShowSupplierForm(true);
  };

  const openCreateOrder = () => {
    setEditingOrder(null);
    resetOrderForm();
    setShowOrderForm(true);
  };

  const openEditOrder = (order: PurchaseOrder) => {
    setEditingOrder(order);
    setOrderForm({
      supplierId: order.supplierId,
      expectedDate: order.expectedDate ? order.expectedDate.slice(0, 10) : '',
      description: order.description,
      items: order.items.length > 0
        ? order.items.map(item => ({
            materialId: item.materialId,
            quantity: String(item.quantity),
            unitPrice: String(item.unitPrice),
          }))
        : [{ materialId: '', quantity: '1', unitPrice: '' }],
    });
    setShowOrderForm(true);
  };

  const fetchData = async () => {
    const [sRes, oRes, mRes] = await Promise.all([
      api.get('/api/suppliers').then(r => r.data).catch(() => []),
      api.get('/api/purchase-orders').then(r => r.data).catch(() => []),
      api.get('/api/inventory/materials').then(r => r.data).catch(() => []),
    ]);
    setSuppliers(sRes);
    setOrders(oRes);
    setMaterials(mRes);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // Suggest PO for low stock
  const lowStock = materials.filter(m => m.isLowStock);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingSupplier) {
        await api.patch(`/api/suppliers/${editingSupplier.id}`, supplierForm);
      } else {
        await api.post('/api/suppliers', supplierForm);
      }
      fetchData();
    } catch {
      const now = new Date().toISOString();
      if (editingSupplier) {
        setSuppliers(prev => prev.map(s => s.id === editingSupplier.id ? {
          ...s,
          ...supplierForm,
          updatedAt: now,
        } : s));
      } else {
        setSuppliers(prev => [{
          id: Date.now().toString(),
          ...supplierForm,
          totalOrders: 0,
          createdAt: now,
          updatedAt: now,
        }, ...prev]);
      }
    }
    setShowSupplierForm(false);
    resetSupplierForm();
    setSubmitting(false);
  };

  const handleDeleteSupplier = async (supplier: Supplier) => {
    if (!window.confirm(`"${supplier.name}" tedarikçisini silmek istiyor musun?`)) return;
    try {
      await api.delete(`/api/suppliers/${supplier.id}`);
      fetchData();
    } catch (error: any) {
      const message = error?.response?.data?.error || error?.message || 'Tedarikçi silinemedi';
      window.alert(message);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const validItems = orderForm.items.filter(i => i.materialId && parseFloat(i.quantity) > 0 && parseFloat(i.unitPrice) >= 0);
      const payload = {
        ...orderForm,
        items: validItems.map(i => ({ materialId: i.materialId, quantity: parseFloat(i.quantity), unitPrice: parseFloat(i.unitPrice) })),
      };

      if (editingOrder) {
        await api.patch(`/api/purchase-orders/${editingOrder.id}`, payload);
      } else {
        await api.post('/api/purchase-orders', payload);
      }
      fetchData();
    } catch {
      const items: POItem[] = orderForm.items.map((i, idx) => ({
        id: `poi-${idx}`,
        materialId: i.materialId,
        materialName: materials.find(m => m.id === i.materialId)?.name || '',
        quantity: parseFloat(i.quantity),
        unitPrice: parseFloat(i.unitPrice),
        receivedQty: 0,
      }));
      const totalAmount = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
      const nextOrder = {
        id: editingOrder?.id || Date.now().toString(),
        supplierId: orderForm.supplierId,
        supplierName: suppliers.find(s => s.id === orderForm.supplierId)?.name || '',
        items,
        totalAmount,
        status: (editingOrder?.status || 'draft') as PurchaseOrder['status'],
        expectedDate: orderForm.expectedDate,
        receivedDate: editingOrder?.receivedDate || '',
        description: orderForm.description,
        createdAt: editingOrder?.createdAt || new Date().toISOString(),
      };

      setOrders(prev => editingOrder
        ? prev.map(o => o.id === editingOrder.id ? nextOrder : o)
        : [nextOrder, ...prev]
      );
    }
    setShowOrderForm(false);
    setEditingOrder(null);
    resetOrderForm();
    setSubmitting(false);
  };

  const handleStatusChange = async (order: PurchaseOrder, status: PurchaseOrder['status']) => {
    if (order.status === status) return;
    setOrderStatusUpdating(order.id);
    try {
      await api.patch(`/api/purchase-orders/${order.id}/status`, { status });
      fetchData();
    } catch {
      setOrders(prev => prev.map(o => o.id === order.id ? {
        ...o,
        status,
        receivedDate: status === 'received' && !o.receivedDate ? new Date().toISOString() : o.receivedDate,
      } : o));
    } finally {
      setOrderStatusUpdating(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm('Bu siparişi silmek istiyor musun?')) return;
    try {
      await api.delete(`/api/purchase-orders/${orderId}`);
      fetchData();
    } catch {
      setOrders(prev => prev.filter(o => o.id !== orderId));
    }
  };

  const addOrderItem = () => setOrderForm({ ...orderForm, items: [...orderForm.items, { materialId: '', quantity: '', unitPrice: '' }] });
  const removeOrderItem = (idx: number) => { if (orderForm.items.length > 1) setOrderForm({ ...orderForm, items: orderForm.items.filter((_, i) => i !== idx) }); };
  const updateOrderItem = (idx: number, field: string, value: string) => { const items = [...orderForm.items]; items[idx] = { ...items[idx], [field]: value }; setOrderForm({ ...orderForm, items }); };

  const formatCurrency = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n);
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tedarikçiler & Satın Alma</h1>
          <p className="text-gray-500 text-sm mt-1">Tedarikçi kartları ve satın alma siparişleri</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button onClick={() => setTab('suppliers')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === 'suppliers' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
          <Truck size={14} className="inline mr-2" />Tedarikçiler ({suppliers.length})
        </button>
        <button onClick={() => setTab('orders')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === 'orders' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
          <ShoppingCart size={14} className="inline mr-2" />Siparişler ({orders.length})
        </button>
      </div>

      {/* Low Stock Suggestions */}
      {tab === 'orders' && lowStock.length > 0 && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-amber-600" />
            <p className="text-sm font-semibold text-amber-800">Düşük Stok — Sipariş Önerisi</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map(m => (
              <button key={m.id} onClick={() => {
                setShowOrderForm(true);
                setOrderForm(prev => ({ ...prev, items: [{ materialId: m.id, quantity: String(m.minStockLevel - m.currentStock), unitPrice: '' }] }));
              }} className="badge badge-yellow cursor-pointer hover:bg-amber-100 transition-colors">
                {m.name} ({m.currentStock}/{m.minStockLevel})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Suppliers Tab */}
      {tab === 'suppliers' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={openCreateSupplier} className="btn btn-primary"><Plus size={16} /> Tedarikçi Ekle</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {suppliers.length === 0 ? (
              <div className="card p-8 text-center col-span-full">
                <Truck size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm">Henüz tedarikçi eklenmemiş</p>
              </div>
            ) : (
              suppliers.map(s => (
                <div key={s.id} className="card p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <span className="text-emerald-700 font-semibold text-sm">{s.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{s.name}</h3>
                      <p className="text-xs text-gray-500">{s.contactPerson}</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    {s.phone && <div className="flex items-center gap-2"><Phone size={13} className="text-gray-400" />{s.phone}</div>}
                    {s.email && <div className="flex items-center gap-2"><Mail size={13} className="text-gray-400" />{s.email}</div>}
                    {s.address && <div className="flex items-center gap-2"><MapPin size={13} className="text-gray-400" />{s.address}</div>}
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <button onClick={() => openEditSupplier(s)} className="btn btn-secondary !px-3 !py-1.5 text-xs">
                      <Pencil size={13} /> Düzenle
                    </button>
                    <button onClick={() => handleDeleteSupplier(s)} className="btn btn-secondary !px-3 !py-1.5 text-xs text-red-600 hover:bg-red-50">
                      <Trash2 size={13} /> Sil
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {tab === 'orders' && (
        <div>
          <div className="flex justify-end mb-4">
        <button onClick={openCreateOrder} className="btn btn-primary"><Plus size={16} /> Yeni Sipariş</button>
          </div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Tarih</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Tedarikçi</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Durum</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Beklenen Tarih</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Kayıt</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Tutar</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.length === 0 ? (
                    <tr><td colSpan={7} className="text-center text-sm text-gray-500 py-8">Sipariş bulunmuyor</td></tr>
                  ) : (
                    orders.map(o => (
                      <tr key={o.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3.5 text-sm text-gray-500">{formatDate(o.createdAt)}</td>
                        <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{o.supplierName}</td>
                        <td className="px-5 py-3.5">
                          <select
                            className="select text-sm py-1.5"
                            value={o.status}
                            onChange={e => handleStatusChange(o, e.target.value as PurchaseOrder['status'])}
                            disabled={orderStatusUpdating === o.id}
                          >
                            {Object.entries(PO_STATUS).map(([value, config]) => (
                              <option key={value} value={value}>{config.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-600">{formatDate(o.expectedDate)}</td>
                        <td className="px-5 py-3.5 text-sm text-gray-600">{o.receivedDate ? formatDate(o.receivedDate) : '-'}</td>
                        <td className="px-5 py-3.5 text-sm font-semibold text-gray-900 text-right">{formatCurrency(o.totalAmount)}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => openEditOrder(o)} className="btn btn-secondary !px-3 !py-1.5 text-xs">
                              <Pencil size={13} /> Düzenle
                            </button>
                            <button onClick={() => handleDeleteOrder(o.id)} className="btn btn-secondary !px-3 !py-1.5 text-xs text-red-600 hover:bg-red-50">
                              <Trash2 size={13} /> Sil
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
        </div>
      )}

      {/* Supplier Form Modal */}
      {showSupplierForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">{editingSupplier ? 'Tedarikçiyi Düzenle' : 'Yeni Tedarikçi'}</h3>
              <button onClick={() => { setShowSupplierForm(false); resetSupplierForm(); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateSupplier} className="space-y-4">
              <input type="text" className="input" placeholder="Firma Adı *" value={supplierForm.name} onChange={e => setSupplierForm({...supplierForm, name: e.target.value})} required />
              <input type="text" className="input" placeholder="İletişim Kişisi" value={supplierForm.contactPerson} onChange={e => setSupplierForm({...supplierForm, contactPerson: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input type="text" className="input" placeholder="Telefon" value={supplierForm.phone} onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})} />
                <input type="email" className="input" placeholder="E-posta" value={supplierForm.email} onChange={e => setSupplierForm({...supplierForm, email: e.target.value})} />
              </div>
              <input type="text" className="input" placeholder="Adres" value={supplierForm.address} onChange={e => setSupplierForm({...supplierForm, address: e.target.value})} />
              <input type="text" className="input" placeholder="Vergi No" value={supplierForm.taxId} onChange={e => setSupplierForm({...supplierForm, taxId: e.target.value})} />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowSupplierForm(false); resetSupplierForm(); }} className="btn btn-secondary flex-1">İptal</button>
                <button type="submit" disabled={submitting} className="btn btn-primary flex-1">{editingSupplier ? 'Güncelle' : 'Kaydet'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Form Modal */}
      {showOrderForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-2xl p-6 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingOrder ? 'Satın Alma Siparişini Düzenle' : 'Yeni Satın Alma Siparişi'}
              </h3>
              <button onClick={() => setShowOrderForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tedarikçi *</label>
                  <select className="select" value={orderForm.supplierId} onChange={e => setOrderForm({...orderForm, supplierId: e.target.value})} required>
                    <option value="">Seçiniz...</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Beklenen Teslim</label>
                  <input type="date" className="input" value={orderForm.expectedDate} onChange={e => setOrderForm({...orderForm, expectedDate: e.target.value})} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Sipariş Kalemleri</label>
                  <button type="button" onClick={addOrderItem} className="text-brand-600 text-sm font-medium hover:text-brand-700">+ Kalem Ekle</button>
                </div>
                <div className="space-y-2">
                  {orderForm.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                      <select className="select flex-1" value={item.materialId} onChange={e => updateOrderItem(idx, 'materialId', e.target.value)} required>
                        <option value="">Malzeme seç...</option>
                        {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                      </select>
                      <input type="number" step="0.01" className="input w-20" placeholder="Adet" value={item.quantity} onChange={e => updateOrderItem(idx, 'quantity', e.target.value)} required />
                      <input type="number" step="0.01" className="input w-28" placeholder="Birim Fiyat ₺" value={item.unitPrice} onChange={e => updateOrderItem(idx, 'unitPrice', e.target.value)} required />
                      {orderForm.items.length > 1 && <button type="button" onClick={() => removeOrderItem(idx)} className="text-red-400 hover:text-red-600"><X size={16} /></button>}
                    </div>
                  ))}
                </div>
              </div>

              <textarea className="input min-h-[60px]" placeholder="Açıklama..." value={orderForm.description} onChange={e => setOrderForm({...orderForm, description: e.target.value})} />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowOrderForm(false); setEditingOrder(null); resetOrderForm(); }} className="btn btn-secondary flex-1">İptal</button>
                <button type="submit" disabled={submitting} className="btn btn-primary flex-1">
                  {submitting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : editingOrder ? 'Kaydet' : 'Sipariş Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
