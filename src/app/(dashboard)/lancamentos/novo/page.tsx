import { Metadata } from "next";
import { TransactionForm } from "@/components/transactions/TransactionForm";

export const metadata: Metadata = { title: "Novo Lançamento" };

export default function NovoLancamentoPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">Novo Lançamento</h1>
      <p className="text-slate-500 text-sm mb-6">Registre uma nova entrada ou saída</p>
      <TransactionForm />
    </div>
  );
}
