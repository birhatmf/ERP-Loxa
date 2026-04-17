import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGlobalShortcuts } from '../hooks/useKeyboardShortcuts';
import CommandPalette from './CommandPalette';
import NotificationPanel from './NotificationPanel';
import {
  LayoutDashboard,
  Banknote,
  Package,
  FolderKanban,
  FileText,
  LogOut,
  Menu,
  X,
  ShoppingCart,
  Users,
  Landmark,
  Truck,
  ClipboardCheck,
  BarChart3,
  Target,
  RefreshCw,
  Tag,
  Calculator,
  Settings,
} from 'lucide-react';

const navSections = [
  {
    label: 'Genel',
    items: [
      { to: '/', label: 'Kontrol Paneli', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Finans',
    items: [
      { to: '/finance', label: 'Kasa', icon: Banknote },
      { to: '/finance/recurring', label: 'Tekrarlayan', icon: RefreshCw },
      { to: '/checks', label: 'Çekler', icon: Landmark },
      { to: '/budget', label: 'Bütçe', icon: Target },
      { to: '/tax-calculator', label: 'Vergi Hesapla', icon: Calculator },
      { to: '/reports', label: 'Raporlar', icon: BarChart3 },
    ],
  },
  {
    label: 'Stok',
    items: [
      { to: '/inventory', label: 'Malzemeler', icon: Package },
      { to: '/inventory/stock-count', label: 'Stok Sayım', icon: ClipboardCheck },
      { to: '/suppliers', label: 'Tedarikçiler', icon: Truck },
    ],
  },
  {
    label: 'Satış',
    items: [
      { to: '/projects', label: 'Projeler', icon: FolderKanban },
      { to: '/sales', label: 'Satış', icon: ShoppingCart },
      { to: '/invoices', label: 'Faturalar', icon: FileText },
      { to: '/customers', label: 'Müşteriler', icon: Users },
    ],
  },
  {
    label: 'Ayarlar',
    items: [
      { to: '/categories', label: 'Kategoriler', icon: Tag },
      { to: '/settings', label: 'Sistem Ayarları', icon: Settings },
    ],
  },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useGlobalShortcuts();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <CommandPalette />

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-900 transition-all duration-300 lg:static
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
          ${collapsed ? 'w-[68px]' : 'w-64'}`}
      >
        <div className={`flex h-16 items-center border-b border-slate-800 ${collapsed ? 'justify-center px-3' : 'justify-between px-5'}`}>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            {!collapsed && <span className="text-white font-semibold text-lg tracking-tight">ERP</span>}
          </div>
          <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white lg:hidden"><X size={20} /></button>
          {!collapsed && (
            <button onClick={() => setCollapsed(true)} className="hidden lg:block text-slate-400 hover:text-white text-xs">◀</button>
          )}
          {collapsed && (
            <button onClick={() => setCollapsed(false)} className="hidden lg:block text-slate-400 hover:text-white text-xs absolute right-2 top-5">▶</button>
          )}
        </div>

        {!collapsed && (
          <div className="px-3 pt-3">
            <button
              onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
              className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 bg-slate-800/50 hover:bg-slate-800 transition-colors"
            >
              <span>Ara...</span>
              <kbd className="ml-auto text-[10px] bg-slate-700 px-1.5 py-0.5 rounded">⌘K</kbd>
            </button>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          {navSections.map(section => (
            <div key={section.label}>
              {!collapsed && (
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 mb-1.5">{section.label}</p>
              )}
              {collapsed && <div className="border-t border-slate-800 mb-2" />}
              <div className="space-y-0.5">
                {section.items.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === '/'}
                    onClick={() => setSidebarOpen(false)}
                    title={collapsed ? label : undefined}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                        collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
                      } ${
                        isActive
                          ? 'bg-brand-600/20 text-brand-400'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`
                    }
                  >
                    <Icon size={18} />
                    {!collapsed && <span className="flex-1">{label}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <div className={`flex items-center gap-3 mb-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="h-9 w-9 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-slate-300">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`flex items-center gap-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors ${collapsed ? 'justify-center w-full py-2' : 'w-full px-3 py-2'}`}
          >
            <LogOut size={16} />
            {!collapsed && <span>Çıkış</span>}
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-4 lg:px-6">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500 hover:text-gray-700 lg:hidden"><Menu size={22} /></button>
          <div className="flex-1" />
          <NotificationPanel />
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
