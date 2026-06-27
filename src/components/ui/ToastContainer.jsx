import React from 'react';
import { useToastStore } from '../../store/toastStore';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div 
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full sm:w-auto p-4 pointer-events-none"
      role="live"
      aria-live="assertive"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border transition-all duration-300 transform translate-y-0 scale-100 animate-slide-in
              ${isSuccess ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/80 dark:border-emerald-900/50 dark:text-emerald-200' : ''}
              ${isError ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/80 dark:border-rose-900/50 dark:text-rose-200' : ''}
              ${toast.type === 'info' ? 'bg-sky-50 border-sky-200 text-sky-800 dark:bg-sky-950/80 dark:border-sky-900/50 dark:text-sky-200' : ''}
            `}
            role={isError ? 'alert' : 'status'}
          >
            {isSuccess && <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" />}
            {isError && <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />}
            {toast.type === 'info' && <Info className="h-5 w-5 shrink-0 text-sky-500" />}

            <p className="text-sm font-medium leading-5">{toast.message}</p>

            <button
              onClick={() => removeToast(toast.id)}
              className="ml-auto p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
