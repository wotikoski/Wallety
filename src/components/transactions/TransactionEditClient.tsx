"use client";

import { useQuery } from "@tanstack/react-query";
import { TransactionForm } from "./TransactionForm";

export function TransactionEditClient({ id, onClose }: { id: string; onClose?: () => void }) {
  // Always hit the network when opening the edit page. Without this, returning
  // to edit the same row after a save would render the form from a stale
  // cache, and the next PUT would silently revert unrelated fields.
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["transaction", id],
    queryFn: () => fetch(`/api/transactions/${id}`).then((r) => { if (!r.ok) { return r.json().then((b) => { throw new Error(b?.error ?? `API ${r.status}`); }); } return r.json(); }),
    staleTime: 0,
    refetchOnMount: "always",
  });

  // Show a full-size skeleton only when there is no cached data at all.
  // When data is already in cache (isLoading=false, isFetching=true) we render
  // the form immediately from the cached snapshot — the form key will change
  // once the fresh data arrives and force-remount with updated defaults.
  // Hiding the form during background re-fetches collapsed the modal to a
  // tiny div, leaving the backdrop exposed and causing accidental closes.
  if (isLoading) {
    return (
      <div className="bg-white rounded-[14px] border border-app-border shadow-card p-6 min-h-[320px] flex items-center justify-center">
        <span className="text-app-muted text-sm">Carregando...</span>
      </div>
    );
  }

  // Key on the row's updatedAt so a refetch after a save force-remounts the
  // form with fresh defaults — belt-and-suspenders alongside the reset()
  // effect inside TransactionForm.
  const t = data?.transaction;
  const formKey = t ? `${t.id}:${t.updatedAt ?? ""}` : "empty";
  return <TransactionForm key={formKey} transaction={t} onClose={onClose} />;
}
