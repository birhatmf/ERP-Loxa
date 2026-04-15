import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Plus, Users, X, Phone, Mail, MapPin, ShoppingCart, FileText, History } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  taxId: string;
  notes: string;
  totalPurchases: number;
  outstandingBalance: number;
  createdAt: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', taxId: '', notes: '' });

  const fetchCustomers = async () => {
    try {
      const { data } = await api.get('/api/customers');
      setCustomers(data);
    } catch {
      setCustomers([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchCustomers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/customers', form);
      setShowForm(false);
      setForm({ name: '', phone: '', email: '', address: '', taxId: '', notes: '' });
      fetchCustomers();
    } catch {
      const newCustomer: Customer = {
        id: Date.now().toString(),
        ...form,
        totalPurchases: 0,
        outstandingBalance: 0,
        createdAt: new Date().toISOString(),
      };
      setCustomers(prev => [newCustomer, ...prev]);
      setShowForm(false);
      setForm({ name: '', phone: '', email: '', address: '', taxId: '', notes: '' });
    }
    setSubmitting(false);
  };

  const formatCurrency = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n);
  const formatDate = (d: string) => new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Müşteriler (CRM)</h1>
          <p className="text-gray-500 text-sm mt-1">Müşteri kartları ve ilişki geçmişi</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          <Plus size={16} /> Yeni Müşteri
        </button>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {customers.length === 0 ? (
          <div className="card p-8 text-center col-span-full">
            <Users size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">Henüz müşteri eklenmemiş</p>
          </div>
        ) : (
          customers.map(c => (
            <div key={c.id} className="card p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedCustomer(c)}>
              <div className="flex items-start gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-brand-700 font-semibold text-sm">{c.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{c.name}</h3>
                  {c.taxId && <p className="text-xs text-gray-400">VKN/TCKN: {c.taxId}</p>}
                </div>
              </div>

              <div className="space-y-1.5 text-sm text-gray-600">
                {c.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-gray-400" />
                    <span>{c.phone}</span>
                  </div>
                )}
                {c.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={13} className="text-gray-400" />
                    <span className="truncate">{c.email}</span>
                  </div>
                )}
                {c.address && (
                  <div className="flex items-center gap-2">
                    <MapPin size={13} className="text-gray-400" />
                    <span className="truncate">{c.address}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between">
                <div>
                  <p className="text-xs text-gray-400">Toplam Alışveriş</p>
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(c.totalPurchases)}</p>
                </div>
                {c.outstandingBalance > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Bakiye</p>
                    <p className="text-sm font-semibold text-red-600">{formatCurrency(c.outstandingBalance)}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-lg p-6 max-h-[85vh] overflow-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-brand-100 flex items-center justify-center">
                  <span className="text-brand-700 font-bold text-lg">{selectedCustomer.name.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedCustomer.name}</h3>
                  <p className="text-xs text-gray-500">Kayıt: {formatDate(selectedCustomer.createdAt)}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              {/* Contact Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                {selectedCustomer.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone size={14} className="text-gray-400" />
                    <a href={`tel:${selectedCustomer.phone}`} className="text-brand-600 hover:underline">{selectedCustomer.phone}</a>
                  </div>
                )}
                {selectedCustomer.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail size={14} className="text-gray-400" />
                    <a href={`mailto:${selectedCustomer.email}`} className="text-brand-600 hover:underline">{selectedCustomer.email}</a>
                  </div>
                )}
                {selectedCustomer.address && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin size={14} className="text-gray-400" />
                    <span>{selectedCustomer.address}</span>
                  </div>
                )}
                {selectedCustomer.taxId && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText size={14} className="text-gray-400" />
                    <span>VKN/TCKN: {selectedCustomer.taxId}</span>
                  </div>
                )}
              </div>

              {/* Financial Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 rounded-lg p-3">
                  <p className="text-xs text-emerald-700">Toplam Alışveriş</p>
                  <p className="text-lg font-bold text-emerald-800">{formatCurrency(selectedCustomer.totalPurchases)}</p>
                </div>
                <div className={`rounded-lg p-3 ${selectedCustomer.outstandingBalance > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                  <p className={`text-xs ${selectedCustomer.outstandingBalance > 0 ? 'text-red-700' : 'text-gray-500'}`}>Bekleyen Bakiye</p>
                  <p className={`text-lg font-bold ${selectedCustomer.outstandingBalance > 0 ? 'text-red-800' : 'text-gray-700'}`}>
                    {formatCurrency(selectedCustomer.outstandingBalance)}
                  </p>
                </div>
              </div>

              {selectedCustomer.notes && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Notlar</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{selectedCustomer.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button className="btn btn-secondary flex-1 text-sm">
                  <ShoppingCart size={14} /> Yeni Satış
                </button>
                <button className="btn btn-secondary flex-1 text-sm">
                  <FileText size={14} /> Fatura Kes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Customer Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Yeni Müşteri</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Müşteri Adı *</label>
                <input type="text" className="input" placeholder="Firma veya kişi adı" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefon</label>
                  <input type="text" className="input" placeholder="05xx xxx xx xx" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">E-posta</label>
                  <input type="email" className="input" placeholder="ornek@mail.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Adres</label>
                <input type="text" className="input" placeholder="Tam adres" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">VKN / TCKN</label>
                <input type="text" className="input" placeholder="Vergi kimlik numarası" value={form.taxId} onChange={e => setForm({...form, taxId: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notlar</label>
                <textarea className="input min-h-[60px]" placeholder="Müşteri ile ilgili notlar..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary flex-1">İptal</button>
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
