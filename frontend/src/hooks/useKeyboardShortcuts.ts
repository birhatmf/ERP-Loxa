import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Shortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger in inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;

      for (const s of shortcuts) {
        const ctrlMatch = s.ctrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey);
        const altMatch = s.alt ? e.altKey : !e.altKey;
        const shiftMatch = s.shift ? e.shiftKey : !e.shiftKey;

        if (e.key.toLowerCase() === s.key.toLowerCase() && ctrlMatch && altMatch && shiftMatch) {
          e.preventDefault();
          s.action();
          return;
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts]);
}

export function useGlobalShortcuts() {
  const navigate = useNavigate();

  useKeyboardShortcuts([
    { key: '1', alt: true, action: () => navigate('/'), description: 'Dashboard' },
    { key: '2', alt: true, action: () => navigate('/finance'), description: 'Kasa' },
    { key: '3', alt: true, action: () => navigate('/inventory'), description: 'Stok' },
    { key: '4', alt: true, action: () => navigate('/projects'), description: 'Projeler' },
    { key: '5', alt: true, action: () => navigate('/invoices'), description: 'Faturalar' },
    { key: '6', alt: true, action: () => navigate('/sales'), description: 'Satış' },
    { key: '7', alt: true, action: () => navigate('/checks'), description: 'Çekler' },
    { key: '8', alt: true, action: () => navigate('/customers'), description: 'Müşteriler' },
  ]);
}
