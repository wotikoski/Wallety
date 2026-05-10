"use client";

import { useCallback, useEffect, useState } from "react";
import { Toast, registerToastHandler } from "./use-toast";
import { X, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    registerToastHandler((toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, toast.duration ?? 4000);
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium min-w-[280px] max-w-sm animate-fade-in",
            toast.variant === "destructive"
              ? "bg-[#dc2626] text-white"
              : "bg-[#0d1117] border border-[var(--color-border)] text-[var(--color-text)]",
          )}
        >
          {toast.variant === "destructive"
            ? <AlertCircle size={16} className="shrink-0" />
            : <CheckCircle2 size={16} className="shrink-0 text-income-light" />
          }
          <div className="flex-1">
            <p>{toast.title}</p>
            {toast.description && <p className="opacity-70 text-xs mt-0.5">{toast.description}</p>}
          </div>
          {toast.action && (
            <button
              onClick={() => { toast.action!.onClick(); dismiss(toast.id); }}
              className="shrink-0 text-[13px] font-semibold text-[#3b82f6] hover:text-[#60a5fa] transition px-1"
            >
              {toast.action.label}
            </button>
          )}
          <button
            onClick={() => dismiss(toast.id)}
            className="opacity-60 hover:opacity-100 transition"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
