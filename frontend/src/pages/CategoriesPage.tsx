import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Plus, Tag, X, Edit2, Trash2, Palette } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'project' | 'material';
  color: string;
  icon: string;
  count: number;
}

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
];

const TYPE_LABELS: Record<string, string> = {
  income: 'Gelir',
  expense: 'Gider',
  project: 'Proje',
  material: 'Malzeme',
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'expense', color: COLORS[0] });

  const fetchData = async () => {
    try {
      const { data } = await api.get('/api/categories');
      setCategories(data);
    } catch {
      // Default categories
      setCategories([
        { id: '1', name: 'Kira', type: 'expense', color: '#ef4444', icon: '', count: 0 },
        { id: '2', name: 'Maaş', type: 'expense', color: '#f97316', icon: '', count: 0 },
        { id: '3', name: 'Malzeme', type: 'expense', color: '#eab308', icon: '', count: 0 },
        { id: '4', name: 'Nakliye', type: 'expense', color: '#3b82f6', icon: '', count: 0 },
        { id: '5', name: 'Fatura', type: 'expense', color: '#8b5cf6', icon: '', count: 0 },
        { id: '6', name: 'Satış Geliri', type: 'income', color: '#22c55e', icon: '', count: 0 },
        { id: '7', name: 'Hizmet Geliri', type: 'income', color: '#14b8a6', icon: '', count: 0 },
        { id: '8', name: 'Dolap', type: 'project', color: '#6366f1', icon: '', count: 0 },
        { id: '9', name: 'Mutfak', type: 'project', color: '#a855f7', icon: '', count: 0 },
        { id: '10', name: 'Panel', type: 'material', color: '#06b6d4', icon: '', count: 0 },
      ]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await api.patch(`/api/categories/${editingId}`, form);
      } else {
        await api.post('/api/categories', form);
      }
      fetchData();
    } catch {
      if (editingId) {
        setCategories(prev => prev.map(c => c.id === editingId ? { ...c, ...form, type: form.type as any } : c));
      } else {
        setCategories(prev => [...prev, { id: Date.now().toString(), ...form, type: form.type as any, icon: '', count: 0 }]);
      }
    }
    setShowForm(false);
    setEditingId(null);
    setForm({ name: '', type: 'expense', color: COLORS[0] });
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    try { await api.delete(`/api/categories/${id}`); } catch {}
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({ name: cat.name, type: cat.type, color: cat.color });
    setShowForm(true);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" /></div>;

  const grouped = categories.reduce((acc, cat) => {
    if (!acc[cat.type]) acc[cat.type] = [];
    acc[cat.type].push(cat);
    return acc;
  }, {} as Record<string, Category[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kategoriler & Etiketler</h1>
          <p className="text-gray-500 text-sm mt-1">İşlemler, projeler ve malzemeler için kategoriler</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', type: 'expense', color: COLORS[0] }); }} className="btn btn-primary">
          <Plus size={16} /> Yeni Kategori
        </button>
      </div>

      {/* Grouped Categories */}
      {Object.entries(grouped).map(([type, cats]) => (
        <div key={type}>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{TYPE_LABELS[type] || type}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {cats.map(cat => (
              <div key={cat.id} className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: cat.color + '20' }}>
                  <Tag size={14} style={{ color: cat.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{cat.name}</p>
                  <p className="text-xs text-gray-400">{cat.count} kullanım</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(cat)} className="p-1 rounded text-gray-400 hover:text-brand-600 hover:bg-brand-50">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">{editingId ? 'Kategori Düzenle' : 'Yeni Kategori'}</h3>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori Adı</label>
                <input type="text" className="input" placeholder="Örn: Kira" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tip</label>
                <select className="select" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  <option value="expense">Gider</option>
                  <option value="income">Gelir</option>
                  <option value="project">Proje</option>
                  <option value="material">Malzeme</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Renk</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm({...form, color})}
                      className={`w-8 h-8 rounded-lg transition-all ${form.color === color ? 'ring-2 ring-offset-2 ring-brand-500 scale-110' : 'hover:scale-110'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="btn btn-secondary flex-1">İptal</button>
                <button type="submit" disabled={submitting} className="btn btn-primary flex-1">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
