import { Metadata } from "next";
import { TransactionForm } from "@/components/transactions/TransactionForm";

export const metadata: Metadata = { title: "Novo Lançamento" };

export default function NovoLancamentoPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-[22px] font-extrabold text-app-text tracking-tight mb-1">Novo Lançamento</h1>
      <p className="text-app-muted text-[13px] font-medium mb-6">Registre uma nova entrada ou saída</p>
      <TransactionForm />
    </div>
  );
}
