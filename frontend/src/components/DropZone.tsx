import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, File, Image, FileText } from 'lucide-react';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
}

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // MB
  existingFiles?: UploadedFile[];
  onRemoveFile?: (id: string) => void;
}

export default function DropZone({
  onFilesSelected,
  accept = '*',
  multiple = true,
  maxSize = 10,
  existingFiles = [],
  onRemoveFile,
}: DropZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    setError('');

    const files = Array.from(e.dataTransfer.files);
    const valid = files.filter(f => f.size <= maxSize * 1024 * 1024);

    if (valid.length !== files.length) {
      setError(`${files.length - valid.length} dosya ${maxSize}MB sınırını aşıyor`);
    }

    if (valid.length > 0) {
      onFilesSelected(multiple ? valid : [valid[0]]);
    }
  }, [maxSize, multiple, onFilesSelected]);

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesSelected(multiple ? files : [files[0]]);
    }
    e.target.value = '';
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image size={16} className="text-blue-500" />;
    if (type.includes('pdf')) return <FileText size={16} className="text-red-500" />;
    return <File size={16} className="text-gray-500" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-brand-500 bg-brand-50'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }`}
      >
        <Upload size={24} className={`mx-auto mb-2 ${dragOver ? 'text-brand-500' : 'text-gray-400'}`} />
        <p className="text-sm font-medium text-gray-700">
          Dosyaları sürükleyip bırakın veya <span className="text-brand-600">seçin</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">Maks {maxSize}MB • {accept === '*' ? 'Tüm dosyalar' : accept}</p>
        <input ref={inputRef} type="file" className="hidden" accept={accept} multiple={multiple} onChange={handleSelect} />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {/* Existing files */}
      {existingFiles.length > 0 && (
        <div className="space-y-1.5">
          {existingFiles.map(f => (
            <div key={f.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
              {getFileIcon(f.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{f.name}</p>
                <p className="text-xs text-gray-400">{formatSize(f.size)}</p>
              </div>
              {onRemoveFile && (
                <button onClick={() => onRemoveFile(f.id)} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
