"use client";

import { useState, useCallback } from "react";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

let toastState: ((toast: Toast) => void) | null = null;

export function useToast() {
  const toast = useCallback(
    ({ title, description, variant = "default" }: Omit<Toast, "id">) => {
      if (toastState) {
        toastState({ id: Date.now().toString(), title, description, variant });
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
