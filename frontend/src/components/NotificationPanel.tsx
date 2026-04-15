import React, { useEffect, useState } from 'react';
import { Bell, AlertTriangle, FileText, Banknote, Package, X, Check } from 'lucide-react';
import api from '../api/client';

interface Notification {
  id: string;
  type: 'low_stock' | 'pending_invoice' | 'overdue_check' | 'info';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export default function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const checkAlerts = async () => {
    const notifs: Notification[] = [];
    try {
      const [lowStock, invoices, checks] = await Promise.all([
        api.get('/api/inventory/materials/low-stock').then(r => r.data).catch(() => []),
        api.get('/api/invoices').then(r => r.data).catch(() => []),
        api.get('/api/payment/checks').then(r => r.data).catch(() => []),
      ]);

      lowStock.forEach((m: any) => {
        notifs.push({
          id: `stock-${m.id}`,
          type: 'low_stock',
          title: 'Düşük Stok Uyarısı',
          message: `${m.name} — ${m.currentStock} ${m.unit} (min: ${m.minStockLevel})`,
          time: new Date().toISOString(),
          read: false,
        });
      });

      invoices.filter((i: any) => i.status === 'pending').forEach((i: any) => {
        const due = new Date(i.dueDate);
        const daysLeft = Math.ceil((due.getTime() - Date.now()) / 86400000);
        if (daysLeft <= 7) {
          notifs.push({
            id: `invoice-${i.id}`,
            type: 'pending_invoice',
            title: daysLeft <= 0 ? 'Vadesi Geçmiş Fatura' : 'Vadesi Yaklaşan Fatura',
            message: `${i.invoiceNumber} — ${daysLeft <= 0 ? 'Gecikmiş' : `${daysLeft} gün kaldı`}`,
            time: new Date().toISOString(),
            read: false,
          });
        }
      });

      checks.filter((c: any) => c.status === 'pending').forEach((c: any) => {
        const due = new Date(c.dueDate);
        const daysLeft = Math.ceil((due.getTime() - Date.now()) / 86400000);
        if (daysLeft <= 7) {
          notifs.push({
            id: `check-${c.id}`,
            type: 'overdue_check',
            title: 'Vadesi Yaklaşan Çek',
            message: `${c.checkNumber || 'Çek'} — ${c.ownerName} — ${daysLeft <= 0 ? 'Vadesi geçmiş' : `${daysLeft} gün kaldı`}`,
            time: new Date().toISOString(),
            read: false,
          });
        }
      });
    } catch {}
    setNotifications(notifs);
  };

  useEffect(() => {
    checkAlerts();
    const interval = setInterval(checkAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  const unread = notifications.filter(n => !n.read).length;

  const iconMap: Record<string, React.ReactNode> = {
    low_stock: <Package size={14} className="text-red-500" />,
    pending_invoice: <FileText size={14} className="text-amber-500" />,
    overdue_check: <Banknote size={14} className="text-purple-500" />,
    info: <Bell size={14} className="text-blue-500" />,
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 card shadow-xl z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-sm text-gray-900">Bildirimler</h3>
              {unread > 0 && <span className="badge badge-red text-[10px]">{unread} yeni</span>}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">Bildirim yok</p>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 ${!n.read ? 'bg-blue-50/30' : ''}`}>
                    <div className="mt-0.5">{iconMap[n.type]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                    </div>
                    {!n.read && (
                      <button
                        onClick={() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
                        className="mt-0.5 text-gray-300 hover:text-gray-500"
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
