"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";

/**
 * Provides a deferred-delete pattern with undo support.
 *
 * Usage:
 *   const { schedule, isPending } = useUndoDelete();
 *   // On delete click:
 *   schedule(item.id, "Item excluído", async () => {
 *     await fetch(`/api/items/${item.id}`, { method: "DELETE" });
 *     queryClient.invalidateQueries({ queryKey: ["items"] });
 *   });
 *   // Filter displayed list:
 *   const visible = items.filter(i => !isPending(i.id));
 */
export function useUndoDelete() {
  const { toast } = useToast();
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  // Stores both the timer handle AND the delete function so we can fire
  // pending deletes immediately when the component unmounts (page navigation).
  const pending = useRef<
    Map<string, { timer: ReturnType<typeof setTimeout>; deleteFn: () => Promise<void> }>
  >(new Map());

  // On unmount: fire any still-pending deletes immediately instead of cancelling them.
  // This handles the case where the user navigates away before the 5-second window expires.
  useEffect(() => {
    const p = pending.current;
    return () => {
      p.forEach(({ timer, deleteFn }) => {
        clearTimeout(timer);
        deleteFn().catch(() => {});
      });
      p.clear();
    };
  }, []);

  const schedule = useCallback(
    (id: string, label: string, deleteFn: () => Promise<void>) => {
      // Mark as pending — hide from list immediately (optimistic UI)
      setPendingIds((prev) => new Set([...prev, id]));

      const undo = () => {
        const entry = pending.current.get(id);
        if (entry) clearTimeout(entry.timer);
        pending.current.delete(id);
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      };

      const timer = setTimeout(async () => {
        pending.current.delete(id);
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        await deleteFn().catch(() => {});
      }, 5000);

      pending.current.set(id, { timer, deleteFn });

      toast({
        title: label,
        duration: 6000,
        action: { label: "Desfazer", onClick: undo },
      });
    },
    [toast],
  );

  const isPending = useCallback(
    (id: string) => pendingIds.has(id),
    [pendingIds],
  );

  return { schedule, isPending };
}
