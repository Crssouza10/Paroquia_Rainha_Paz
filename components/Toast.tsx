"use client";

import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  text: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-50 flex flex-col gap-2 max-w-sm w-[calc(100%-2rem)] sm:w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={`pointer-events-auto p-4 rounded-xl shadow-xl border flex items-start gap-3 transition-all animate-slide-up backdrop-blur-md ${
        toast.type === "success"
          ? "bg-white/95 border-emerald-200 text-emerald-900 dark:bg-slate-900/95 dark:border-emerald-500/30 dark:text-emerald-200"
          : toast.type === "error"
          ? "bg-white/95 border-rose-200 text-rose-900 dark:bg-slate-900/95 dark:border-rose-500/30 dark:text-rose-200"
          : "bg-white/95 border-blue-200 text-blue-900 dark:bg-slate-900/95 dark:border-blue-500/30 dark:text-blue-200"
      }`}
    >
      {toast.type === "success" && (
        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
      )}
      {toast.type === "error" && (
        <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
      )}
      {toast.type === "info" && (
        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
      )}

      <div className="flex-1 text-xs font-medium leading-relaxed">{toast.text}</div>

      <button
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-0.5 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
