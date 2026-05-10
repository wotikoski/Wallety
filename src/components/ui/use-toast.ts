"use client";

import { useCallback } from "react";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive";
  /** Optional action button shown inside the toast (e.g. "Desfazer"). */
  action?: ToastAction;
  /** Auto-dismiss delay in ms. Default 4000; use 6000 for undo toasts. */
  duration?: number;
}

let toastState: ((toast: Toast) => void) | null = null;

export function useToast() {
  const toast = useCallback(
    ({ title, description, variant = "default", action, duration }: Omit<Toast, "id">) => {
      if (toastState) {
        toastState({ id: Date.now().toString(), title, description, variant, action, duration });
      } else {
        console.log("Toast:", title, description);
      }
    },
    [],
  );
  return { toast };
}

export function registerToastHandler(handler: (toast: Toast) => void) {
  toastState = handler;
}
