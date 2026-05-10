"use client";

import { type ReactNode } from "react";
import { X } from "lucide-react";
import { Portal } from "./Portal";

/**
 * Canonical form-modal — matches the "Nova Meta" pattern.
 * Single primary button, eyebrow uppercase labels, surface-card wrapper,
 * sticky header with title + X close button.
 */
export function FormModal({
  open,
  title,
  onClose,
  children,
  submitLabel,
  onSubmit,
  submitting,
  submittingLabel,
}: {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  submitLabel: string;
  onSubmit: (e: React.FormEvent) => void;
  submitting?: boolean;
  submittingLabel?: string;
}) {
  if (!open) return null;
  return (
    <Portal>
      <div className="fixed inset-0 bg-black/55 backdrop-blur-[6px] z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div
          className="w-full sm:max-w-md rounded-t-2xl sm:rounded-[16px] overflow-y-auto"
          style={{
            maxHeight: "95vh",
            background: "var(--surface-card)",
            border: "1px solid var(--color-border)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
            style={{
              background: "var(--surface-card)",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <h2 className="text-[15px] font-semibold text-[var(--color-text)] m-0">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-[var(--text-faint)] hover:text-[var(--text-dim)] transition p-1"
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={onSubmit} className="p-6 space-y-4">
            {children}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-60 text-white py-3 rounded-[10px] text-[13px] font-semibold transition-colors duration-150"
            >
              {submitting ? (submittingLabel ?? "Salvando...") : submitLabel}
            </button>
          </form>
        </div>
      </div>
    </Portal>
  );
}

/** Shared input/textarea/select className used inside FormModal. */
export const formInputCls =
  "w-full border border-[var(--color-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] " +
  "bg-[var(--surface-raised)] text-[var(--color-text)] placeholder-[var(--text-faint)] " +
  "focus:outline-none focus:ring-2 focus:ring-[#3b82f6] transition";

/** Shared label className — eyebrow uppercase. */
export const formLabelCls =
  "block text-[11px] font-bold uppercase tracking-[0.07em] text-[var(--text-mute)] mb-1.5";
