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
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Clear all timers on unmount
  useEffect(() => {
    const t = timers.current;
    return () => { t.forEach(clearTimeout); };
  }, []);

  const schedule = useCallback(
    (id: string, label: string, deleteFn: () => Promise<void>) => {
      // Mark as pending — hide from list immediately (optimistic UI)
      setPendingIds((prev) => new Set([...prev, id]));

      const undo = () => {
        clearTimeout(timers.current.get(id));
        timers.current.delete(id);
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      };

      const timer = setTimeout(async () => {
        timers.current.delete(id);
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        await deleteFn().catch(() => {});
      }, 5000);

      timers.current.set(id, timer);

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
