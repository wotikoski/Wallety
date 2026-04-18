"use client";

import { useQuery } from "@tanstack/react-query";
import { TransactionForm } from "./TransactionForm";

export function TransactionEditClient({ id }: { id: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["transaction", id],
    queryFn: () => fetch(`/api/transactions/${id}`).then((r) => r.json()),
  });

  if (isLoading) {
    return <div className="text-slate-400 text-sm">Carregando...</div>;
  }

  return <TransactionForm transaction={data?.transaction} />;
}
