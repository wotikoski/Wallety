"use client";

import { useEffect, useState } from "react";
import { Toast, registerToastHandler } from "./use-toast";
import { X, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    registerToastHandler((toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 4000);
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
              ? "bg-expense text-white"
              : "bg-slate-900 text-white",
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
          <button
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            className="opacity-60 hover:opacity-100 transition"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
