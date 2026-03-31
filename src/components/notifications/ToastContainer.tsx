"use client";

import React from 'react';
import { useIDEStore } from '../../store/useIDEStore';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useIDEStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-10 right-4 z-[300] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-2.5 shadow-lg border font-mono text-xs animate-[slideIn_0.2s_ease-out] ${
            toast.type === 'success'
              ? 'bg-surface border-primary text-primary'
              : toast.type === 'error'
              ? 'bg-surface border-accent-error text-accent-error'
              : 'bg-surface border-muted text-text-main'
          }`}
        >
          <span className="material-symbols-outlined text-sm">
            {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}
          </span>
          <span>{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-muted hover:text-text-main ml-2 transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
