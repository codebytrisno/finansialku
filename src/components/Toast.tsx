"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { MaterialSymbol } from "./MaterialSymbol";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const dismiss = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-20 left-1/2 z-[100] flex w-[90vw] max-w-md -translate-x-1/2 flex-col gap-2 lg:bottom-6 lg:left-auto lg:right-6 lg:translate-x-0 lg:w-auto lg:max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-slide-up pointer-events-auto flex items-start gap-3 rounded-2xl px-4 py-3 text-label-sm font-medium shadow-xl ${
              t.type === "success"
                ? "bg-primary-container text-on-primary-container"
                : t.type === "error"
                ? "bg-error-container text-on-error-container"
                : "bg-inverse-surface text-inverse-on-surface"
            }`}
          >
            <MaterialSymbol
              icon={t.type === "success" ? "check_circle" : t.type === "error" ? "error" : "info"}
              size={18}
              className="shrink-0 mt-0.5"
            />
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
            >
              <MaterialSymbol icon="close" size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
