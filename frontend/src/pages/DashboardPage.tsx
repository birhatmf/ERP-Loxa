import React, { useEffect, useState } from 'react';
import api from '../api/client';
import type { CashBalance, Project, Material } from '../types';
import { Banknote, FolderKanban, AlertTriangle, Package, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const [balance, setBalance] = useState<CashBalance | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [lowStock, setLowStock] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/finance/cash/balance').then(r => r.data).catch(() => null),
      api.get('/api/project/projects').then(r => r.data).catch(() => []),
      api.get('/api/inventory/materials/low-stock').then(r => r.data).catch(() => []),
    ]).then(([bal, proj, stock]) => {
      setBalance(bal);
      setProjects(proj);
      setLowStock(stock);
      setLoading(false);
    });
  }, []);

  const activeProjects = projects.filter(p => ['active', 'in_progress'].includes(p.status));
  const formatCurrency = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kontrol Paneli</h1>
        <p className="text-gray-500 text-sm mt-1">Genel durum özeti</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Balance */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Kasa Bakiyesi</span>
            <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Banknote size={18} className="text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(balance?.balance || 0)}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-500">{balance?.transactionCount || 0} işlem</span>
          </div>
        </div>

        {/* Active Projects */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Aktif Projeler</span>
            <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <FolderKanban size={18} className="text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{activeProjects.length}</p>
          <p className="text-xs text-gray-500 mt-2">{projects.length} toplam proje</p>
        </div>

        {/* Income / Expense */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Gelir / Gider</span>
            <div className="h-9 w-9 rounded-lg bg-brand-50 flex items-center justify-center">
              <TrendingUp size={18} className="text-brand-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-lg font-bold text-emerald-600">{formatCurrency(balance?.totalIncome || 0)}</p>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <TrendingDown size={12} className="text-red-500" />
            <p className="text-sm text-red-600">{formatCurrency(balance?.totalExpenses || 0)}</p>
          </div>
        </div>

        {/* Low Stock */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Düşük Stok Uyarısı</span>
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${lowStock.length > 0 ? 'bg-red-50' : 'bg-gray-100'}`}>
              <AlertTriangle size={18} className={lowStock.length > 0 ? 'text-red-600' : 'text-gray-400'} />
            </div>
          </div>
          <p className={`text-2xl font-bold ${lowStock.length > 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {lowStock.length}
          </p>
          <p className="text-xs text-gray-500 mt-2">malzeme kritik seviyede</p>
        </div>
      </div>

      {/* Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Projects List */}
        <div className="card">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Aktif Projeler</h2>
            <Link to="/projects" className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1">
              Tümünü Gör <ArrowRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {activeProjects.length === 0 ? (
              <p className="p-5 text-sm text-gray-500 text-center">Aktif proje bulunmuyor</p>
            ) : (
              activeProjects.slice(0, 5).map(p => (
                <Link key={p.id} to={`/projects/${p.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{p.customerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(p.totalPrice)}</p>
                    <span className={`badge text-[10px] mt-1 ${p.status === 'active' ? 'badge-green' : 'badge-blue'}`}>
                      {p.status}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Low Stock List */}
        <div className="card">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Düşük Stok</h2>
            <Link to="/inventory" className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1">
              Stok Yönetimi <ArrowRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {lowStock.length === 0 ? (
              <p className="p-5 text-sm text-gray-500 text-center">Tüm stoklar yeterli seviyede</p>
            ) : (
              lowStock.slice(0, 5).map(m => (
                <div key={m.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
                      <Package size={14} className="text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{m.name}</p>
                      <p className="text-xs text-gray-500">Min: {m.minStockLevel} {m.unit}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-600">{m.currentStock} {m.unit}</p>
                    <span className="badge badge-red text-[10px] mt-1">Kritik</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
