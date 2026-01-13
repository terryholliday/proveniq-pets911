'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

type Toast = {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
};

type ToastContextType = {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const TOAST_ICONS: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const TOAST_COLORS: Record<ToastType, string> = {
  success: 'bg-green-900/90 border-green-700 text-green-100',
  error: 'bg-red-900/90 border-red-700 text-red-100',
  warning: 'bg-amber-900/90 border-amber-700 text-amber-100',
  info: 'bg-blue-900/90 border-blue-700 text-blue-100',
};

const TOAST_ICON_COLORS: Record<ToastType, string> = {
  success: 'text-green-400',
  error: 'text-red-400',
  warning: 'text-amber-400',
  info: 'text-blue-400',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);

    // Auto-remove after duration
    const duration = toast.duration || 4000;
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map(toast => {
        const Icon = TOAST_ICONS[toast.type];
        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-slide-in ${TOAST_COLORS[toast.type]}`}
          >
            <Icon className={`w-5 h-5 flex-shrink-0 ${TOAST_ICON_COLORS[toast.type]}`} />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{toast.title}</div>
              {toast.message && (
                <div className="text-xs opacity-80 mt-0.5">{toast.message}</div>
              )}
            </div>
            <button
              onClick={() => onRemove(toast.id)}
              className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// Utility functions for common toast patterns
export function toast(addToast: ToastContextType['addToast']) {
  return {
    success: (title: string, message?: string) => addToast({ type: 'success', title, message }),
    error: (title: string, message?: string) => addToast({ type: 'error', title, message }),
    warning: (title: string, message?: string) => addToast({ type: 'warning', title, message }),
    info: (title: string, message?: string) => addToast({ type: 'info', title, message }),
  };
}
