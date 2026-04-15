import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FolderKanban, Package, Banknote, FileText, Users, ShoppingCart, ArrowRight } from 'lucide-react';
import api from '../api/client';

interface SearchResult {
  id: string;
  type: 'project' | 'material' | 'transaction' | 'invoice' | 'customer' | 'sale';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  path: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  project: <FolderKanban size={16} className="text-blue-500" />,
  material: <Package size={16} className="text-emerald-500" />,
  transaction: <Banknote size={16} className="text-amber-500" />,
  invoice: <FileText size={16} className="text-purple-500" />,
  customer: <Users size={16} className="text-pink-500" />,
  sale: <ShoppingCart size={16} className="text-indigo-500" />,
};

const typeLabels: Record<string, string> = {
  project: 'Proje',
  material: 'Malzeme',
  transaction: 'İşlem',
  invoice: 'Fatura',
  customer: 'Müşteri',
  sale: 'Satış',
};

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const [projects, materials, invoices, sales] = await Promise.all([
        api.get('/api/project/projects').then(r => r.data).catch(() => []),
        api.get('/api/inventory/materials').then(r => r.data).catch(() => []),
        api.get('/api/invoices').then(r => r.data).catch(() => []),
        api.get('/api/sales').then(r => r.data).catch(() => []),
      ]);

      const ql = q.toLowerCase();
      const res: SearchResult[] = [];

      projects.filter((p: any) => p.name?.toLowerCase().includes(ql) || p.customerName?.toLowerCase().includes(ql))
        .forEach((p: any) => res.push({
          id: p.id, type: 'project', title: p.name, subtitle: p.customerName,
          icon: typeIcons.project, path: `/projects/${p.id}`,
        }));

      materials.filter((m: any) => m.name?.toLowerCase().includes(ql))
        .forEach((m: any) => res.push({
          id: m.id, type: 'material', title: m.name, subtitle: `${m.currentStock} ${m.unit}`,
          icon: typeIcons.material, path: '/inventory',
        }));

      invoices.filter((i: any) => i.invoiceNumber?.toLowerCase().includes(ql))
        .forEach((i: any) => res.push({
          id: i.id, type: 'invoice', title: i.invoiceNumber, subtitle: `${i.grandTotal} TL`,
          icon: typeIcons.invoice, path: '/invoices',
        }));

      sales.filter((s: any) => s.customerName?.toLowerCase().includes(ql) || s.description?.toLowerCase().includes(ql))
        .forEach((s: any) => res.push({
          id: s.id, type: 'sale', title: `${s.customerName} - Satış`, subtitle: `${s.totalAmount} TL`,
          icon: typeIcons.sale, path: '/sales',
        }));

      setResults(res.slice(0, 20));
    } catch {
      setResults([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery(''); setSelected(0); setResults([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && results[selected]) {
      navigate(results[selected].path);
      setOpen(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)}>
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" />
      <div className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-xl" onClick={e => e.stopPropagation()}>
        <div className="card overflow-hidden shadow-2xl">
          <div className="flex items-center gap-3 px-4 border-b border-gray-100">
            <Search size={18} className="text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              className="w-full py-4 text-sm bg-transparent outline-none placeholder-gray-400"
              placeholder="Proje, malzeme, fatura, müşteri ara... (Ctrl+K)"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            {loading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent flex-shrink-0" />}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {results.length === 0 && query && !loading ? (
              <p className="text-sm text-gray-500 text-center py-8">Sonuç bulunamadı</p>
            ) : (
              results.map((r, i) => (
                <button
                  key={`${r.type}-${r.id}`}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    i === selected ? 'bg-brand-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => { navigate(r.path); setOpen(false); }}
                >
                  {r.icon}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.title}</p>
                    <p className="text-xs text-gray-500 truncate">{r.subtitle}</p>
                  </div>
                  <span className="badge badge-gray text-[10px]">{typeLabels[r.type]}</span>
                  <ArrowRight size={14} className="text-gray-300" />
                </button>
              ))
            )}
            {!query && !loading && (
              <p className="text-sm text-gray-400 text-center py-8">Aramaya başlayın...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
