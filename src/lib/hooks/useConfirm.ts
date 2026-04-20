"use client";

import { useState, useCallback } from "react";

type PendingAction = (() => void) | null;

interface ConfirmOptions {
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
}

/**
 * Hook that replaces window.confirm() with a styled modal.
 *
 * Usage:
 *   const { confirm, dialogProps } = useConfirm();
 *   // In JSX: <ConfirmDialog {...dialogProps} />
 *   // To trigger: confirm(() => mutation.mutate(id), { description: "..." });
 */
export function useConfirm() {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({});
  const [pending, setPending] = useState<PendingAction>(null);

  const confirm = useCallback((action: () => void, opts: ConfirmOptions = {}) => {
    setOptions(opts);
    setPending(() => action);
    setOpen(true);
  }, []);

  const handleConfirm = useCallback(() => {
    pending?.();
    setOpen(false);
    setPending(null);
  }, [pending]);

  const handleCancel = useCallback(() => {
    setOpen(false);
    setPending(null);
  }, []);

  return {
    confirm,
    dialogProps: {
      open,
      ...options,
      onConfirm: handleConfirm,
      onCancel: handleCancel,
    },
  };
}
