import React, { useState, useRef } from 'react';
import { UploadCloud, File, X, Check } from 'lucide-react';

export default function DragDropUpload({ onFileSelect, accept = '*/*', maxSizeMb = 10, error }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const processFile = (selectedFile) => {
    if (!selectedFile) return;

    // Check size limit
    if (selectedFile.size > maxSizeMb * 1024 * 1024) {
      alert(`File is too large! Maximum limit is ${maxSizeMb}MB.`);
      return;
    }

    setFile(selectedFile);
    onFileSelect(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  const removeFile = (e) => {
    e.stopPropagation();
    setFile(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-2">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        className={`relative border-2 border-dashed rounded-2xl p-6 transition-all cursor-pointer flex flex-col items-center justify-center text-center
          ${isDragActive 
            ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20 scale-[0.99]' 
            : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-900/50'
          }
          ${error ? 'border-rose-350 bg-rose-50/10' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={accept}
          onChange={handleChange}
        />

        {file ? (
          <div className="w-full space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 bg-white dark:bg-slate-850 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm relative group">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg text-indigo-600 dark:text-indigo-400">
                <File className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{file.name}</span>
                <span className="block text-[10px] text-slate-400 font-semibold">{formatBytes(file.size)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="p-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                  <Check className="w-3.5 h-3.5" />
                </span>
                <button
                  type="button"
                  onClick={removeFile}
                  className="p-1 bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-450 hover:bg-rose-50 hover:text-rose-600 rounded-full transition-colors"
                  aria-label="Remove file"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Custom file preview mock */}
            {file.type.startsWith('image/') && (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-48 flex items-center justify-center bg-slate-100 dark:bg-slate-900">
                <img
                  src={URL.createObjectURL(file)}
                  alt="Preview"
                  className="max-h-48 object-contain"
                  onLoad={(e) => URL.revokeObjectURL(e.target.src)}
                />
              </div>
            )}

            {file.name.endsWith('.pdf') && (
              <div className="bg-rose-50/30 dark:bg-rose-950/10 border border-rose-100/50 dark:border-rose-900/20 p-4 rounded-xl text-left flex items-start gap-2">
                <span className="p-1 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded text-[9px] font-black uppercase tracking-wider mt-0.5">PDF</span>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">PDF document detected. Click submit to dispatch document.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl inline-flex">
              <UploadCloud className="w-7 h-7" />
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Drag and drop your file here, or <span className="text-indigo-600 dark:text-indigo-400">browse</span>
              </span>
              <span className="block text-[10px] text-slate-400 font-medium mt-1">
                Supports PDFs, Docs, Images, or Archives up to {maxSizeMb}MB
              </span>
            </div>
          </div>
        )}
      </div>
      {error && (
        <p className="text-rose-500 text-xs font-semibold select-none">{error}</p>
      )}
    </div>
  );
}
