"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActiveGroup } from "@/lib/hooks/useActiveGroup";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useConfirm } from "@/lib/hooks/useConfirm";
import { Plus, Trash2, Edit, CreditCard } from "lucide-react";
import { PAYMENT_METHOD_TYPES, getPaymentMethodLabel } from "@/lib/constants/payment-method-types";

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  bankId: string | null;
  closingDay: number | null;
  dueDay: number | null;
  isDefault: boolean;
}

interface FormData {
  name: string;
  type: string;
  bankId: string;
  closingDay: string;
  dueDay: string;
}

export function PaymentMethodsClient() {
  const { activeGroupId } = useActiveGroup();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);

  const params = new URLSearchParams();
  if (activeGroupId) params.set("groupId", activeGroupId);

  const { data: pmData, isLoading } = useQuery<{ paymentMethods: PaymentMethod[] }>({
    queryKey: ["paymentMethods", "all", activeGroupId],
    queryFn: () => fetch(`/api/payment-methods?${params}`).then((r) => r.json()),
  });

  const { confirm, dialogProps } = useConfirm();

  const { data: banksData } = useQuery<{ banks: { id: string; name: string }[] }>({
    queryKey: ["banks", "all", activeGroupId],
    queryFn: () => fetch(`/api/banks?${params}`).then((r) => r.json()),
  });

  const { register, handleSubmit, reset, watch } = useForm<FormData>({
    defaultValues: { type: "bank_account" },
  });
  const watchedType = watch("type");

  const saveMutation = useMutation({
    mutationFn: async (d: FormData) => {
      const url = editing ? `/api/payment-methods/${editing.id}` : "/api/payment-methods";
      const method = editing ? "PUT" : "POST";
      const isCredit = d.type === "credit_card";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: d.name,
          type: d.type,
          bankId: d.bankId || null,
          closingDay: isCredit && d.closingDay ? parseInt(d.closingDay) : null,
          dueDay: isCredit && d.dueDay ? parseInt(d.dueDay) : null,
          groupId: activeGroupId,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Erro ao salvar forma de pagamento");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
      toast({ title: editing ? "Forma de pagamento atualizada!" : "Forma de pagamento criada!" });
      reset();
      setShowForm(false);
      setEditing(null);
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/payment-methods/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Erro ao excluir");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
      toast({ title: "Forma de pagamento excluída" });
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const paymentMethods = pmData?.paymentMethods ?? [];
  const banks = banksData?.banks ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Formas de Pagamento</h1>
          <p className="text-slate-500 text-sm mt-0.5">Gerencie contas, cartões e formas de pagamento</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditing(null); reset(); }}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
        >
          <Plus size={16} />
          Nova Forma
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800 mb-4">{editing ? "Editar" : "Nova"} Forma de Pagamento</h2>
          <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome</label>
              <input
                {...register("name", { required: true })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Ex: Nubank Crédito"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo</label>
              <select {...register("type")} className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                {PAYMENT_METHOD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Banco vinculado (opcional)</label>
              <select {...register("bankId")} className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">Sem banco vinculado</option>
                {banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            {watchedType === "credit_card" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Dia de fechamento</label>
                  <input
                    {...register("closingDay")}
                    type="number"
                    min={1}
                    max={31}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="25"
                  />
                  <p className="text-xs text-slate-400 mt-1">Dia em que a fatura fecha (1–31)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Dia de vencimento</label>
                  <input
                    {...register("dueDay")}
                    type="number"
                    min={1}
                    max={31}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="5"
                  />
                  <p className="text-xs text-slate-400 mt-1">Dia em que a fatura deve ser paga (1–31)</p>
                </div>
              </>
            )}
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditing(null); }}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition disabled:opacity-50"
            >
              {saveMutation.isPending ? "Salvando..." : editing ? "Atualizar" : "Criar"}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? <ListSkeleton rows={4} /> : (
        <div className="divide-y divide-slate-50">
          {paymentMethods.length === 0 ? (
            <p className="px-6 py-12 text-sm text-slate-400 text-center">Nenhuma forma de pagamento</p>
          ) : paymentMethods.map((pm) => (
            <div key={pm.id} className="flex items-center px-6 py-4 gap-4 hover:bg-slate-50/50 transition">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                <CreditCard size={18} className="text-brand-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">{pm.name}</p>
                <p className="text-xs text-slate-400">
                  {getPaymentMethodLabel(pm.type)}
                  {pm.type === "credit_card" && pm.closingDay && pm.dueDay && (
                    <span> · fecha dia {pm.closingDay}, vence dia {pm.dueDay}</span>
                  )}
                </p>
              </div>
              {pm.isDefault && <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Padrão</span>}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setEditing(pm);
                    reset({
                      name: pm.name,
                      type: pm.type,
                      bankId: pm.bankId ?? "",
                      closingDay: pm.closingDay?.toString() ?? "",
                      dueDay: pm.dueDay?.toString() ?? "",
                    });
                    setShowForm(true);
                  }}
                  className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                >
                  <Edit size={14} />
                </button>
                {!pm.isDefault && (
                  <button
                    onClick={() => confirm(() => deleteMutation.mutate(pm.id), {
                      title: "Excluir forma de pagamento",
                      description: `Tem certeza que deseja excluir "${pm.name}"?`,
                      confirmLabel: "Excluir",
                    })}
                    className="p-1.5 text-slate-400 hover:text-expense hover:bg-expense-light rounded-lg transition"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      <ConfirmDialog {...dialogProps} loading={deleteMutation.isPending} />
    </div>
  );
}
