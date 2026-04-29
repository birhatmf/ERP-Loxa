import React, { useEffect, useState } from 'react';
import api from '../api/client';
import type { Project } from '../types';
import { Plus, FolderKanban, X, ArrowRight, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  draft: { label: 'Taslak', class: 'badge-gray' },
  active: { label: 'Aktif', class: 'badge-green' },
  in_progress: { label: 'Devam Ediyor', class: 'badge-blue' },
  completed: { label: 'Tamamlandı', class: 'badge-purple' },
  cancelled: { label: 'İptal', class: 'badge-red' },
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', customerName: '', totalPrice: '' });
  const [submitting, setSubmitting] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editForm, setEditForm] = useState({ name: '', customerName: '', description: '', totalPrice: '' });

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/api/project/projects');
      setProjects(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/project/projects', { ...form, totalPrice: parseFloat(form.totalPrice) || 0 });
      setShowForm(false);
      setForm({ name: '', customerName: '', totalPrice: '' });
      fetchProjects();
    } finally { setSubmitting(false); }
  };

  const openEdit = (project: Project) => {
    setEditingProject(project);
    setEditForm({
      name: project.name,
      customerName: project.customerName,
      description: project.description || '',
      totalPrice: String(project.totalPrice),
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    setSubmitting(true);
    try {
      const { data } = await api.patch(`/api/project/projects/${editingProject.id}`, {
        name: editForm.name,
        customerName: editForm.customerName,
        description: editForm.description,
        totalPrice: parseFloat(editForm.totalPrice) || 0,
      });

      setProjects(prev => prev.map(project => (project.id === editingProject.id ? { ...project, ...data } : project)));
      setEditingProject(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (project: Project) => {
    const confirmed = window.confirm(`"${project.name}" projesini silmek istediğine emin misin?`);
    if (!confirmed) return;

    setSubmitting(true);
    try {
      await api.delete(`/api/project/projects/${project.id}`);
      setProjects(prev => prev.filter(p => p.id !== project.id));
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projeler</h1>
          <p className="text-gray-500 text-sm mt-1">Satışlardan otomatik oluşan proje ve maliyet takibi</p>
        </div>
      </div>

      {/* Projects Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Proje</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Müşteri</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Durum</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Toplam Fiyat</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Maliyet</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Kâr</th>
                <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Kalem</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {projects.length === 0 ? (
                <tr><td colSpan={8} className="text-center text-sm text-gray-500 py-8">
                  <FolderKanban size={32} className="mx-auto text-gray-300 mb-3" />
                  Henüz proje bulunmuyor
                </td></tr>
              ) : (
                projects.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-sm text-gray-900">{p.name}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{p.customerName}</td>
                    <td className="px-5 py-4">
                      <span className={`badge ${STATUS_MAP[p.status]?.class || 'badge-gray'}`}>
                        {STATUS_MAP[p.status]?.label || p.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-900 text-right whitespace-nowrap">{formatCurrency(p.totalPrice)}</td>
                    <td className="px-5 py-4 text-sm text-gray-600 text-right whitespace-nowrap">{formatCurrency(p.totalCost)}</td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <span className={`text-sm font-semibold ${p.profitMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatCurrency(p.profitMargin)}
                      </span>
                      {p.profitMarginPercentage !== undefined && (
                        <span className="text-xs text-gray-400 ml-1">({p.profitMarginPercentage.toFixed(1)}%)</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500 text-center">{p.itemCount}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                          title="Düzenle"
                        >
                          <Pencil size={14} />
                          Düzenle
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p)}
                          disabled={submitting}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                          title="Sil"
                        >
                          <Trash2 size={14} />
                          Sil
                        </button>
                        <Link to={`/projects/${p.id}`} className="text-brand-600 hover:text-brand-700 text-sm font-medium inline-flex items-center gap-1">
                          Detay <ArrowRight size={14} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Project Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Yeni Proje</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Proje Adı</label>
                <input type="text" className="input" placeholder="Örn: Villa Mutfak Dolabı" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Müşteri Adı</label>
                <input type="text" className="input" placeholder="Müşteri adı" value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Toplam Fiyat (₺)</label>
                <input type="number" step="0.01" className="input" placeholder="0.00" value={form.totalPrice} onChange={e => setForm({...form, totalPrice: e.target.value})} required />
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

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Proje Düzenle</h3>
              <button onClick={() => setEditingProject(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Proje Adı</label>
                <input type="text" className="input" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Müşteri Adı</label>
                <input type="text" className="input" value={editForm.customerName} onChange={e => setEditForm({...editForm, customerName: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Açıklama</label>
                <textarea className="input min-h-[96px]" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Toplam Fiyat (₺)</label>
                <input type="number" step="0.01" className="input" value={editForm.totalPrice} onChange={e => setEditForm({...editForm, totalPrice: e.target.value})} required />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingProject(null)} className="btn btn-secondary flex-1">İptal</button>
                <button type="submit" disabled={submitting} className="btn btn-primary flex-1">
                  {submitting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
