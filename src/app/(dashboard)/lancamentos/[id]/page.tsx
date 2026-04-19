import { Metadata } from "next";
import { TransactionEditClient } from "@/components/transactions/TransactionEditClient";

export const metadata: Metadata = { title: "Editar Lançamento" };

export default async function EditLancamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">Editar Lançamento</h1>
      <p className="text-slate-500 text-sm mb-6">Atualize os dados do lançamento</p>
      <TransactionEditClient id={id} />
    </div>
  );
}
