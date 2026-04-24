import { Metadata } from "next";
import { TransactionEditClient } from "@/components/transactions/TransactionEditClient";

export const metadata: Metadata = { title: "Editar Lançamento" };

export default async function EditLancamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="max-w-2xl">
      <h1 className="text-[22px] font-extrabold text-app-text tracking-tight mb-1">Editar Lançamento</h1>
      <p className="text-app-muted text-[13px] font-medium mb-6">Atualize os dados do lançamento</p>
      <TransactionEditClient id={id} />
    </div>
  );
}
