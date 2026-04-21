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

  return <TransactionForm transaction={data?.transaction} />;
}
