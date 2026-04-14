import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import type { Project, Material } from '../types';
import { ArrowLeft, Plus, X, Package, ChevronDown } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Taslak' },
  { value: 'active', label: 'Aktif' },
  { value: 'in_progress', label: 'Devam Ediyor' },
  { value: 'completed', label: 'Tamamlandı' },
  { value: 'cancelled', label: 'İptal' },
];

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  draft: { label: 'Taslak', class: 'badge-gray' },
  active: { label: 'Aktif', class: 'badge-green' },
  in_progress: { label: 'Devam Ediyor', class: 'badge-blue' },
  completed: { label: 'Tamamlandı', class: 'badge-purple' },
  cancelled: { label: 'İptal', class: 'badge-red' },
};

export default function ProjectDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [showItemForm, setShowItemForm] = useState(false);
  const [itemForm, setItemForm] = useState({ materialId: '', quantity: '', unitPrice: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchProject = async () => {
    const { data } = await api.get(`/api/project/projects/${id}`);
    setProject(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProject();
    api.get('/api/inventory/materials').then(r => setMaterials(r.data)).catch(() => {});
  }, [id]);

  const handleStatusChange = async (status: string) => {
    await api.patch(`/api/project/projects/${id}/status`, { status });
    fetchProject();
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/api/project/projects/${id}/items`, {
        materialId: itemForm.materialId,
        quantity: parseFloat(itemForm.quantity),
        unitPrice: parseFloat(itemForm.unitPrice),
      });
      setShowItemForm(false);
      setItemForm({ materialId: '', quantity: '', unitPrice: '' });
      fetchProject();
    } finally { setSubmitting(false); }
  };

  const formatCurrency = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" /></div>;
  }

  if (!project) {
    return <div className="text-center py-12 text-gray-500">Proje bulunamadı</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/projects" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-gray-500 text-sm">{project.customerName}</p>
        </div>
        <span className={`badge ${STATUS_MAP[project.status]?.class || 'badge-gray'}`}>
          {STATUS_MAP[project.status]?.label || project.status}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card p-5">
          <p className="text-sm text-gray-500 mb-1">Toplam Fiyat</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(project.totalPrice)}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500 mb-1">Toplam Maliyet</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(project.totalCost)}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500 mb-1">Kâr Marjı</p>
          <p className={`text-xl font-bold ${project.profitMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatCurrency(project.profitMargin)}
            {project.profitMarginPercentage !== undefined && (
              <span className="text-sm font-normal text-gray-400 ml-1">({project.profitMarginPercentage.toFixed(1)}%)</span>
            )}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500 mb-1">Kalem Sayısı</p>
          <p className="text-xl font-bold text-gray-900">{project.items?.length || 0}</p>
        </div>
      </div>

      {/* Status Change */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Durum Güncelle</h3>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map(s => (
            <button
              key={s.value}
              onClick={() => handleStatusChange(s.value)}
              className={`btn text-sm ${project.status === s.value ? 'btn-primary' : 'btn-secondary'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Items */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Proje Kalemleri</h2>
          <button onClick={() => setShowItemForm(true)} className="btn btn-primary btn-sm">
            <Plus size={14} /> Kalem Ekle
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Malzeme</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Miktar</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Birim Fiyat</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Toplam</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(!project.items || project.items.length === 0) ? (
                <tr><td colSpan={4} className="text-center text-sm text-gray-500 py-8">
                  <Package size={32} className="mx-auto text-gray-300 mb-3" />
                  Henüz kalem eklenmemiş
                </td></tr>
              ) : (
                project.items.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-900">
                      {item.materialName || materials.find(m => m.id === item.materialId)?.name || item.materialId}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600 text-right">{item.quantity}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-gray-900 text-right">{formatCurrency(item.totalPrice)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Item Modal */}
      {showItemForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Kalem Ekle</h3>
              <button onClick={() => setShowItemForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Malzeme</label>
                <select className="select" value={itemForm.materialId} onChange={e => setItemForm({...itemForm, materialId: e.target.value})} required>
                  <option value="">Seçiniz...</option>
                  {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Miktar</label>
                  <input type="number" step="0.01" className="input" placeholder="0" value={itemForm.quantity} onChange={e => setItemForm({...itemForm, quantity: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Birim Fiyat (₺)</label>
                  <input type="number" step="0.01" className="input" placeholder="0.00" value={itemForm.unitPrice} onChange={e => setItemForm({...itemForm, unitPrice: e.target.value})} required />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowItemForm(false)} className="btn btn-secondary flex-1">İptal</button>
                <button type="submit" disabled={submitting} className="btn btn-primary flex-1">
                  {submitting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
