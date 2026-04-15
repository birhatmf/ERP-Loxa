import React, { useState } from 'react';
import { Calculator, Percent } from 'lucide-react';

export default function TaxCalculator() {
  const [amount, setAmount] = useState('');
  const [vatRate, setVatRate] = useState('18');
  const [calcType, setCalcType] = useState<'include' | 'exclude'>('exclude');

  const numAmount = parseFloat(amount) || 0;
  const rate = parseFloat(vatRate) / 100;

  let netAmount: number, vatAmount: number, grossAmount: number;
  if (calcType === 'exclude') {
    netAmount = numAmount;
    vatAmount = numAmount * rate;
    grossAmount = numAmount + vatAmount;
  } else {
    grossAmount = numAmount;
    netAmount = numAmount / (1 + rate);
    vatAmount = grossAmount - netAmount;
  }

  const formatCurrency = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n);

  // Stopaj rates
  const stopajRates = [
    { label: 'Serbest Meslek (%20)', rate: 0.20 },
    { label: 'Kira (%20)', rate: 0.20 },
    { label: 'İşçi Hizmet (%5)', rate: 0.05 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vergi Hesaplayıcı</h1>
        <p className="text-gray-500 text-sm mt-1">KDV, stopaj ve net/brüt hesaplama</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KDV Calculator */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calculator size={18} className="text-brand-600" /> KDV Hesaplama
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tutar (₺)</label>
              <input type="number" step="0.01" className="input" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hesaplama Yönü</label>
              <div className="flex gap-2">
                <button onClick={() => setCalcType('exclude')} className={`btn flex-1 text-sm ${calcType === 'exclude' ? 'btn-primary' : 'btn-secondary'}`}>
                  KDV Hariç → Dahil
                </button>
                <button onClick={() => setCalcType('include')} className={`btn flex-1 text-sm ${calcType === 'include' ? 'btn-primary' : 'btn-secondary'}`}>
                  KDV Dahil → Hariç
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">KDV Oranı</label>
              <div className="flex flex-wrap gap-2">
                {['1', '8', '10', '18', '20'].map(r => (
                  <button key={r} onClick={() => setVatRate(r)} className={`btn text-sm ${vatRate === r ? 'btn-primary' : 'btn-secondary'}`}>
                    %{r}
                  </button>
                ))}
                <div className="flex items-center gap-1">
                  <input type="number" min="0" max="100" className="input w-20 text-sm" placeholder="Özel" value={!['1','8','10','18','20'].includes(vatRate) ? vatRate : ''} onChange={e => setVatRate(e.target.value)} />
                  <Percent size={14} className="text-gray-400" />
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Net (KDV Hariç)</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(netAmount)}</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700">KDV (%{vatRate})</p>
                <p className="text-lg font-bold text-blue-800">{formatCurrency(vatAmount)}</p>
              </div>
              <div className="text-center p-3 bg-brand-50 rounded-lg">
                <p className="text-xs text-brand-700">Brüt (KDV Dahil)</p>
                <p className="text-lg font-bold text-brand-800">{formatCurrency(grossAmount)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stopaj Calculator */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Percent size={18} className="text-emerald-600" /> Stopaj Hesaplama
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brüt Tutar (₺)</label>
              <input type="number" step="0.01" className="input" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>

            <div className="space-y-3">
              {stopajRates.map(s => {
                const stopaj = numAmount * s.rate;
                const net = numAmount - stopaj;
                return (
                  <div key={s.label} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{s.label}</span>
                      <span className="badge badge-yellow">%{(s.rate * 100).toFixed(0)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500">Stopaj Tutarı</p>
                        <p className="text-sm font-semibold text-red-600">-{formatCurrency(stopaj)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Net Ödeme</p>
                        <p className="text-sm font-semibold text-emerald-600">{formatCurrency(net)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Reference */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 mb-3">KDV Oranları - Hızlı Referans</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { rate: '%1', items: 'Gazete, dergi, kitap' },
            { rate: '%8', items: 'Gıda, içecek, tekstil, konut' },
            { rate: '%10', items: 'Telekom, dijital hizmetler' },
            { rate: '%18', items: 'Genel oran (çoğu mal/hizmet)' },
          ].map(r => (
            <div key={r.rate} className="bg-gray-50 rounded-lg p-3">
              <p className="text-lg font-bold text-brand-600">{r.rate}</p>
              <p className="text-xs text-gray-500 mt-1">{r.items}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
