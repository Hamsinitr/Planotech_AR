import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Floating Toasts Container */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';
          const isInfo = toast.type === 'info';

          const icon = isSuccess ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : isError ? (
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          ) : isWarning ? (
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
          );

          const borderBg = isSuccess
            ? 'bg-slate-900/95 border-emerald-500/40 text-emerald-100 shadow-emerald-950/30'
            : isError
            ? 'bg-slate-900/95 border-rose-500/40 text-rose-100 shadow-rose-950/30'
            : isWarning
            ? 'bg-slate-900/95 border-amber-500/40 text-amber-100 shadow-amber-950/30'
            : 'bg-slate-900/95 border-blue-500/40 text-blue-100 shadow-blue-950/30';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-300 animate-fade-up text-xs font-semibold ${borderBg}`}
              style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.35)' }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {icon}
                <span className="truncate leading-snug">{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition active:scale-90"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Return a dummy fallback so it never crashes if used outside provider
    return { showToast: (msg) => console.log(msg) };
  }
  return context;
};

export default ToastContext;
