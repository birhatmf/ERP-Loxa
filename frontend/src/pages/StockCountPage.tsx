import React, { useEffect, useState } from 'react';
import api from '../api/client';
import type { Material } from '../types';
import { ClipboardCheck, Check, X, AlertTriangle, RefreshCw } from 'lucide-react';

interface CountItem {
  materialId: string;
  materialName: string;
  unit: string;
  systemStock: number;
  countedStock: string;
  difference: number | null;
}

export default function StockCountPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [items, setItems] = useState<CountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    api.get('/api/inventory/materials').then(r => {
      setMaterials(r.data);
      setItems(r.data.map((m: Material) => ({
        materialId: m.id,
        materialName: m.name,
        unit: m.unit,
        systemStock: m.currentStock,
        countedStock: '',
        difference: null,
      })));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const updateCount = (idx: number, value: string) => {
    const updated = [...items];
    updated[idx].countedStock = value;
    const counted = parseFloat(value);
    updated[idx].difference = isNaN(counted) ? null : counted - updated[idx].systemStock;
    setItems(updated);
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const discrepancies = items.filter(i => i.difference !== null && i.difference !== 0);
  const matched = items.filter(i => i.difference === 0);

  const formatNumber = (n: number) => n.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stok Sayım</h1>
          <p className="text-gray-500 text-sm mt-1">Fiziki stok ile sistem verisi karşılaştırma</p>
        </div>
        {!submitted && (
          <button onClick={() => { setItems(items.map(i => ({ ...i, countedStock: '', difference: null }))); setSubmitted(false); }} className="btn btn-secondary">
            <RefreshCw size={16} /> Sıfırla
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs text-gray-500">Toplam Malzeme</p>
          <p className="text-xl font-bold text-gray-900">{items.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">Sayılan</p>
          <p className="text-xl font-bold text-brand-600">{items.filter(i => i.difference !== null).length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">Eşleşen</p>
          <p className="text-xl font-bold text-emerald-600">{matched.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">Farklı</p>
          <p className={`text-xl font-bold ${discrepancies.length > 0 ? 'text-red-600' : 'text-gray-900'}`}>{discrepancies.length}</p>
        </div>
      </div>

      {/* Count Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Malzeme</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Sistem Stok</th>
                <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Birim</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Sayım</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Fark</th>
                <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item, idx) => {
                const hasDiff = item.difference !== null && item.difference !== 0;
                const counted = item.difference !== null;
                return (
                  <tr key={item.materialId} className={`hover:bg-gray-50 ${hasDiff ? 'bg-red-50/30' : ''}`}>
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{item.materialName}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600 text-right">{formatNumber(item.systemStock)}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500 text-center uppercase">{item.unit}</td>
                    <td className="px-5 py-3.5 text-right">
                      <input
                        type="number"
                        step="0.01"
                        className="input w-28 text-right text-sm"
                        placeholder="—"
                        value={item.countedStock}
                        onChange={e => updateCount(idx, e.target.value)}
                        disabled={submitted}
                      />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {item.difference !== null && (
                        <span className={`text-sm font-semibold ${item.difference === 0 ? 'text-emerald-600' : item.difference > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          {item.difference > 0 ? '+' : ''}{formatNumber(item.difference)}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {counted && (
                        item.difference === 0
                          ? <Check size={16} className="inline text-emerald-500" />
                          : <AlertTriangle size={16} className="inline text-red-500" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {!submitted && (
        <div className="flex items-center gap-4">
          <textarea className="input flex-1 min-h-[60px]" placeholder="Sayım notları..." value={notes} onChange={e => setNotes(e.target.value)} />
          <button onClick={handleSubmit} className="btn btn-primary self-start">
            <ClipboardCheck size={16} /> Sayımı Tamamla
          </button>
        </div>
      )}

      {submitted && discrepancies.length > 0 && (
        <div className="card p-5 border-l-4 border-red-500">
          <h3 className="font-semibold text-gray-900 mb-2">Fark Raporu</h3>
          <div className="space-y-2">
            {discrepancies.map(d => (
              <div key={d.materialId} className="flex items-center justify-between text-sm">
                <span>{d.materialName}</span>
                <span className={`font-semibold ${d.difference! > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  Sistem: {d.systemStock} → Sayım: {d.countedStock} ({d.difference! > 0 ? '+' : ''}{formatNumber(d.difference!)})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
