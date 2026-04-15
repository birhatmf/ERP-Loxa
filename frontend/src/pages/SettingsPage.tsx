import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings, Globe, Palette, Bell, Shield, User, Save, Moon, Sun, Monitor } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => (localStorage.getItem('erp_theme') as any) || 'light');
  const [currency, setCurrency] = useState(localStorage.getItem('erp_currency') || 'TRY');
  const [lang, setLang] = useState(localStorage.getItem('erp_lang') || 'tr');
  const [dateFormat, setDateFormat] = useState(localStorage.getItem('erp_date_format') || 'dd/mm/yyyy');
  const [notifLowStock, setNotifLowStock] = useState(localStorage.getItem('erp_notif_low_stock') !== 'false');
  const [notifOverdue, setNotifOverdue] = useState(localStorage.getItem('erp_notif_overdue') !== 'false');
  const [notifInvoice, setNotifInvoice] = useState(localStorage.getItem('erp_notif_invoice') !== 'false');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('erp_theme', theme);
    localStorage.setItem('erp_currency', currency);
    localStorage.setItem('erp_lang', lang);
    localStorage.setItem('erp_date_format', dateFormat);
    localStorage.setItem('erp_notif_low_stock', String(notifLowStock));
    localStorage.setItem('erp_notif_overdue', String(notifOverdue));
    localStorage.setItem('erp_notif_invoice', String(notifInvoice));

    // Apply theme
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!checked)} className={`w-10 h-5 rounded-full relative transition-colors ${checked ? 'bg-brand-600' : 'bg-gray-300'}`}>
      <span className={`absolute top-0.5 h-4 w-4 bg-white rounded-full shadow transition-all ${checked ? 'left-5' : 'left-0.5'}`} />
    </button>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ayarlar</h1>
        <p className="text-gray-500 text-sm mt-1">Sistem tercihlerinizi yönetin</p>
      </div>

      {/* Profile */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User size={18} className="text-brand-600" /> Profil
        </h3>
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-brand-100 flex items-center justify-center">
            <span className="text-brand-700 font-bold text-xl">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-500">@{user?.username} • {user?.role}</p>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Palette size={18} className="text-brand-600" /> Görünüm
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tema</label>
            <div className="flex gap-2">
              {[
                { value: 'light', label: 'Açık', icon: Sun },
                { value: 'dark', label: 'Koyu', icon: Moon },
                { value: 'system', label: 'Sistem', icon: Monitor },
              ].map(t => (
                <button key={t.value} onClick={() => setTheme(t.value as any)}
                  className={`btn flex-1 text-sm ${theme === t.value ? 'btn-primary' : 'btn-secondary'}`}>
                  <t.icon size={14} /> {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tarih Formatı</label>
            <div className="flex gap-2">
              {[
                { value: 'dd/mm/yyyy', label: '31/12/2025' },
                { value: 'yyyy-mm-dd', label: '2025-12-31' },
                { value: 'dd.mm.yyyy', label: '31.12.2025' },
              ].map(f => (
                <button key={f.value} onClick={() => setDateFormat(f.value)}
                  className={`btn flex-1 text-sm ${dateFormat === f.value ? 'btn-primary' : 'btn-secondary'}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Localization */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Globe size={18} className="text-brand-600" /> Dil & Para Birimi
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dil</label>
            <select className="select" value={lang} onChange={e => setLang(e.target.value)}>
              <option value="tr">Türkçe</option>
              <option value="en">English</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Para Birimi</label>
            <select className="select" value={currency} onChange={e => setCurrency(e.target.value)}>
              <option value="TRY">₺ Türk Lirası</option>
              <option value="USD">$ ABD Doları</option>
              <option value="EUR">€ Euro</option>
              <option value="GBP">£ İngiliz Sterlini</option>
            </select>
          </div>
        </div>
        {currency !== 'TRY' && (
          <p className="text-xs text-amber-600 mt-2 bg-amber-50 rounded-lg p-2">
            ⚠ Çoklu para birimi desteği: Döviz kurları manuel girilmeli veya API entegrasyonu gereklidir.
          </p>
        )}
      </div>

      {/* Notifications */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Bell size={18} className="text-brand-600" /> Bildirimler
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Düşük Stok Uyarıları</p>
              <p className="text-xs text-gray-500">Malzeme minimum seviyenin altına düştüğünde bildir</p>
            </div>
            <Toggle checked={notifLowStock} onChange={setNotifLowStock} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Vadesi Yaklaşan Ödemeler</p>
              <p className="text-xs text-gray-500">Çek ve fatura vadeleri yaklaştığında bildir</p>
            </div>
            <Toggle checked={notifOverdue} onChange={setNotifOverdue} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Fatura Bildirimleri</p>
              <p className="text-xs text-gray-500">Yeni fatura oluşturulduğunda bildir</p>
            </div>
            <Toggle checked={notifInvoice} onChange={setNotifInvoice} />
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield size={18} className="text-brand-600" /> Güvenlik
        </h3>
        <div className="space-y-3">
          <button className="btn btn-secondary w-full text-sm justify-start">
            Şifre Değiştir
          </button>
          <button className="btn btn-secondary w-full text-sm justify-start">
            Aktif Oturumları Görüntüle
          </button>
          <button className="btn btn-secondary w-full text-sm justify-start text-red-600 hover:bg-red-50 hover:border-red-200">
            Tüm Oturumları Kapat
          </button>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={handleSave} className={`btn ${saved ? 'btn-success' : 'btn-primary'}`}>
          {saved ? '✓ Kaydedildi' : <><Save size={16} /> Ayarları Kaydet</>}
        </button>
      </div>
    </div>
  );
}
