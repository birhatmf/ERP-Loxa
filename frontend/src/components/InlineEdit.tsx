import React, { useState, useRef, useEffect } from 'react';
import { Check, X, Pencil } from 'lucide-react';

interface InlineEditProps {
  value: string | number;
  onSave: (value: string) => Promise<void> | void;
  type?: 'text' | 'number';
  displayValue?: string;
  className?: string;
  placeholder?: string;
}

export default function InlineEdit({
  value,
  onSave,
  type = 'text',
  displayValue,
  className = '',
  placeholder = '—',
}: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleSave = async () => {
    if (editValue === String(value)) { setEditing(false); return; }
    setSaving(true);
    try {
      await onSave(editValue);
      setEditing(false);
    } catch { setEditValue(String(value)); }
    setSaving(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') { setEditValue(String(value)); setEditing(false); }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          type={type}
          className="input !py-1 !px-2 !text-sm w-28"
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button onClick={handleSave} disabled={saving} className="p-1 rounded text-emerald-600 hover:bg-emerald-50">
          {saving ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" /> : <Check size={14} />}
        </button>
        <button onClick={() => { setEditValue(String(value)); setEditing(false); }} className="p-1 rounded text-gray-400 hover:bg-gray-100">
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={`inline-flex items-center gap-1.5 cursor-pointer hover:bg-gray-100 rounded px-1 -mx-1 group ${className}`}
    >
      <span>{displayValue || value || placeholder}</span>
      <Pencil size={12} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
    </span>
  );
}
