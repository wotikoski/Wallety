"use client";

import { useQuery } from "@tanstack/react-query";
import { TransactionForm } from "./TransactionForm";

export function TransactionEditClient({ id }: { id: string }) {
  // Always hit the network when opening the edit page. Without this, returning
  // to edit the same row after a save would render the form from a stale
  // cache, and the next PUT would silently revert unrelated fields.
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["transaction", id],
    queryFn: () => fetch(`/api/transactions/${id}`).then((r) => r.json()),
    staleTime: 0,
    refetchOnMount: "always",
  });

  if (isLoading || isFetching) {
    return <div className="text-slate-400 text-sm">Carregando...</div>;
  }

  // Key on the row's updatedAt so a refetch after a save force-remounts the
  // form with fresh defaults — belt-and-suspenders alongside the reset()
  // effect inside TransactionForm.
  const t = data?.transaction;
  const formKey = t ? `${t.id}:${t.updatedAt ?? ""}` : "empty";
  return <TransactionForm key={formKey} transaction={t} />;
}
