import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import type { Project, Material } from '../types';
import DropZone from '../components/DropZone';
import { ArrowLeft, Plus, X, Package, Upload, FileText, Image, RefreshCw } from 'lucide-react';

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

const COST_CATEGORIES = [
  { key: 'material', label: 'Malzeme', color: 'bg-blue-500' },
  { key: 'labor', label: 'İşçilik', color: 'bg-emerald-500' },
  { key: 'transport', label: 'Nakliye', color: 'bg-amber-500' },
  { key: 'other', label: 'Diğer', color: 'bg-gray-400' },
];

interface ProjectFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
}

interface CostBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [showItemForm, setShowItemForm] = useState(false);
  const [showCostForm, setShowCostForm] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown[]>([]);
  const [itemForm, setItemForm] = useState({ materialId: '', quantity: '', unitPrice: '', costCategory: 'material' });
  const [costForm, setCostForm] = useState({ category: 'labor', amount: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchProject = async () => {
    const { data } = await api.get(`/api/project/projects/${id}`);
    setProject(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProject();
    api.get('/api/inventory/materials').then(r => setMaterials(r.data)).catch(() => {});
    // Fetch files
    api.get(`/api/project/projects/${id}/files`).then(r => setFiles(r.data)).catch(() => {});
    // Fetch cost breakdown
    api.get(`/api/project/projects/${id}/cost-breakdown`).then(r => setCostBreakdown(r.data)).catch(() => {
      // Generate from items if API doesn't exist
    });
  }, [id]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/api/project/projects/${id}/items`, {
        materialId: itemForm.materialId,
        quantity: parseFloat(itemForm.quantity),
        unitPrice: parseFloat(itemForm.unitPrice),
        costCategory: itemForm.costCategory,
      });
      setShowItemForm(false);
      setItemForm({ materialId: '', quantity: '', unitPrice: '', costCategory: 'material' });
      fetchProject();
    } finally { setSubmitting(false); }
  };

  const handleStatusChange = async (status: string) => {
    if (!project || status === project.status) return;
    setUpdatingStatus(true);
    try {
      const { data } = await api.patch(`/api/project/projects/${id}/status`, { status });
      setProject(prev => prev ? { ...prev, ...data } : prev);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddCost = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/api/project/projects/${id}/costs`, {
        category: costForm.category,
        amount: parseFloat(costForm.amount),
        description: costForm.description,
      });
      setShowCostForm(false);
      setCostForm({ category: 'labor', amount: '', description: '' });
      fetchProject();
    } catch {
      // Local fallback
      const amount = parseFloat(costForm.amount);
      setCostBreakdown(prev => {
        const existing = prev.find(c => c.category === costForm.category);
        const total = prev.reduce((s, c) => s + c.amount, 0) + amount;
        if (existing) {
          return prev.map(c => c.category === costForm.category
            ? { ...c, amount: c.amount + amount, percentage: ((c.amount + amount) / total) * 100 }
            : { ...c, percentage: (c.amount / total) * 100 }
          );
        }
        return [...prev, { category: costForm.category, amount, percentage: (amount / total) * 100 }];
      });
      setShowCostForm(false);
      setCostForm({ category: 'labor', amount: '', description: '' });
    }
    setSubmitting(false);
  };

  const handleFilesSelected = async (selectedFiles: File[]) => {
    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const { data } = await api.post(`/api/project/projects/${id}/files`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setFiles(prev => [...prev, data]);
      } catch {
        // Local fallback
        setFiles(prev => [...prev, {
          id: Date.now().toString(),
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file),
          uploadedAt: new Date().toISOString(),
        }]);
      }
    }
  };

  const handleRemoveFile = async (fileId: string) => {
    try { await api.delete(`/api/project/projects/${id}/files/${fileId}`); } catch {}
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleOpenFile = async (file: ProjectFile) => {
    try {
      const response = await api.get(file.url, { responseType: 'blob' });
      const blob = new Blob([response.data], {
        type: response.headers?.['content-type'] || file.type || 'application/octet-stream',
      });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch {
      window.open(file.url, '_blank', 'noopener,noreferrer');
    }
  };

  const formatCurrency = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n);
  const formatSize = (bytes: number) => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  // Compute cost breakdown from items
  const itemCosts = project?.items?.reduce((acc, item) => {
    const cat = (item as any).costCategory || 'material';
    acc[cat] = (acc[cat] || 0) + item.totalPrice;
    return acc;
  }, {} as Record<string, number>) || {};

  const totalItemCost = Object.values(itemCosts).reduce((s, v) => s + v, 0);
  const computedBreakdown: CostBreakdown[] = totalItemCost > 0
    ? Object.entries(itemCosts).map(([cat, amount]) => ({
        category: cat,
        amount,
        percentage: (amount / totalItemCost) * 100,
      }))
    : costBreakdown;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" /></div>;
  if (!project) return <div className="text-center py-12 text-gray-500">Proje bulunamadı</div>;

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
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="card p-4">
          <p className="text-xs text-gray-500">Toplam Fiyat</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(project.totalPrice)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">Toplam Maliyet</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(project.totalCost)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">Kâr Marjı</p>
          <p className={`text-lg font-bold ${project.profitMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatCurrency(project.profitMargin)}
            {project.profitMarginPercentage !== undefined && (
              <span className="text-xs font-normal text-gray-400 ml-1">({project.profitMarginPercentage.toFixed(1)}%)</span>
            )}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">Kalem Sayısı</p>
          <p className="text-lg font-bold text-gray-900">{project.items?.length || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">Dosyalar</p>
          <p className="text-lg font-bold text-gray-900">{files.length}</p>
        </div>
      </div>

      {/* Status Change */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <RefreshCw size={16} className="text-brand-600" /> Proje Durumu
          </h3>
          <span className="text-sm text-gray-500">{project.status}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map(s => (
            <button
              key={s.value}
              onClick={() => handleStatusChange(s.value)}
              disabled={updatingStatus || project.status === s.value}
              className={`btn text-sm ${project.status === s.value ? 'btn-primary' : 'btn-secondary'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cost Breakdown */}
      {computedBreakdown.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Maliyet Dağılımı</h3>
            <button onClick={() => setShowCostForm(true)} className="btn btn-secondary text-xs">
              <Plus size={12} /> Ek Maliyet
            </button>
          </div>
          <div className="space-y-3">
            {computedBreakdown.map(cb => {
              const cat = COST_CATEGORIES.find(c => c.key === cb.category);
              return (
                <div key={cb.category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">{cat?.label || cb.category}</span>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(cb.amount)} ({cb.percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${cat?.color || 'bg-gray-400'}`} style={{ width: `${cb.percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between">
            <span className="text-sm font-medium text-gray-700">Toplam Maliyet</span>
            <span className="text-sm font-bold text-gray-900">{formatCurrency(computedBreakdown.reduce((s, c) => s + c.amount, 0))}</span>
          </div>
        </div>
      )}

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
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Kategori</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Miktar</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Birim Fiyat</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Toplam</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(!project.items || project.items.length === 0) ? (
                <tr><td colSpan={5} className="text-center text-sm text-gray-500 py-8">
                  <Package size={32} className="mx-auto text-gray-300 mb-3" />
                  Henüz kalem eklenmemiş
                </td></tr>
              ) : (
                project.items.map(item => {
                  const cat = COST_CATEGORIES.find(c => c.key === ((item as any).costCategory || 'material'));
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 text-sm font-medium text-gray-900">
                        {item.materialName || materials.find(m => m.id === item.materialId)?.name || item.materialId}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="badge" style={{ backgroundColor: (cat?.color || 'bg-gray-400').replace('bg-', '') + '20' }}>
                          {cat?.label || 'Malzeme'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600 text-right">{item.quantity}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-600 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-gray-900 text-right">{formatCurrency(item.totalPrice)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* File Attachments */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Upload size={16} className="text-brand-600" /> Dosya & Evraklar
        </h3>
        <DropZone
          onFilesSelected={handleFilesSelected}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.dwg"
          multiple={true}
          maxSize={25}
          existingFiles={files}
          onRemoveFile={handleRemoveFile}
          onOpenFile={handleOpenFile}
        />
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Malzeme</label>
                <select className="select" value={itemForm.materialId} onChange={e => setItemForm({...itemForm, materialId: e.target.value})} required>
                  <option value="">Seçiniz...</option>
                  {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maliyet Kategorisi</label>
                <select className="select" value={itemForm.costCategory} onChange={e => setItemForm({...itemForm, costCategory: e.target.value})}>
                  {COST_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Miktar</label>
                  <input type="number" step="0.01" className="input" placeholder="0" value={itemForm.quantity} onChange={e => setItemForm({...itemForm, quantity: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Birim Fiyat (₺)</label>
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

      {/* Add Cost Modal */}
      {showCostForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Ek Maliyet Ekle</h3>
              <button onClick={() => setShowCostForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddCost} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select className="select" value={costForm.category} onChange={e => setCostForm({...costForm, category: e.target.value})}>
                  {COST_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tutar (₺)</label>
                <input type="number" step="0.01" className="input" placeholder="0.00" value={costForm.amount} onChange={e => setCostForm({...costForm, amount: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <input type="text" className="input" placeholder="İşçilik, nakliye vb." value={costForm.description} onChange={e => setCostForm({...costForm, description: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCostForm(false)} className="btn btn-secondary flex-1">İptal</button>
                <button type="submit" disabled={submitting} className="btn btn-primary flex-1">Ekle</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
