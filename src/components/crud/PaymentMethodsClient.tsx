"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActiveGroup } from "@/lib/hooks/useActiveGroup";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useUndoDelete } from "@/lib/hooks/useUndoDelete";
import { Plus, Trash2, Edit, CreditCard } from "lucide-react";
import { PAYMENT_METHOD_TYPES, getPaymentMethodLabel } from "@/lib/constants/payment-method-types";
import { PageHeader, PrimaryButton } from "@/components/layout/PageHeader";
import { FormModal, formInputCls, formLabelCls } from "@/components/ui/FormModal";
import { COLOR_PALETTE, ColorPicker, suggestPaletteColor, rotatePaletteColor } from "@/components/ui/ColorPicker";

// Default colors that fit each payment method type semantically
const TYPE_DEFAULT_COLORS: Record<string, string> = {
  cash:         "#22c55e", // green  — dinheiro/grana
  pix:          "#00bdae", // teal   — cor oficial do Pix
  credit_card:  "#f59e0b", // amber  — cartão de crédito
  debit_card:   "#8b5cf6", // purple — cartão de débito
  bank_account: "#3b82f6", // blue   — conta bancária
  other:        "#94a3b8", // slate  — outros
};

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  color: string | null;
  bankId: string | null;
  closingDay: number | null;
  dueDay: number | null;
  supportsInstallments: boolean;
  isDefault: boolean;
}

interface FormData {
  name: string;
  type: string;
  color: string;
  bankId: string;
  closingDay: string;
  dueDay: string;
  supportsInstallments: boolean;
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
    queryFn: () => fetch(`/api/payment-methods?${params}`).then((r) => { if (!r.ok) { return r.json().then((b) => { throw new Error(b?.error ?? `API ${r.status}`); }); } return r.json(); }),
  });

  const { schedule, isPending } = useUndoDelete();

  const { data: banksData } = useQuery<{ banks: { id: string; name: string }[] }>({
    queryKey: ["banks", "all", activeGroupId],
    queryFn: () => fetch(`/api/banks?${params}`).then((r) => { if (!r.ok) { return r.json().then((b) => { throw new Error(b?.error ?? `API ${r.status}`); }); } return r.json(); }),
  });

  const { register, handleSubmit, reset, watch, setValue } = useForm<FormData>({
    defaultValues: { color: COLOR_PALETTE[0] },
  });
  const watchedType = watch("type");
  const watchedColor = watch("color");

  // When creating a new entry, auto-set a semantic color based on the chosen type
  useEffect(() => {
    if (!editing && watchedType) {
      const defaultColor = TYPE_DEFAULT_COLORS[watchedType];
      if (defaultColor) setValue("color", defaultColor);
    }
    // Auto-enable installments for credit cards
    if (watchedType === "credit_card") {
      setValue("supportsInstallments", true);
    }
  }, [watchedType, editing, setValue]);

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
          color: d.color || null,
          bankId: d.bankId || null,
          closingDay: isCredit && d.closingDay ? parseInt(d.closingDay) : null,
          dueDay: isCredit && d.dueDay ? parseInt(d.dueDay) : null,
          supportsInstallments: d.supportsInstallments ?? false,
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

  const paymentMethods = (pmData?.paymentMethods ?? []).filter((pm) => !isPending(pm.id));
  const banks = banksData?.banks ?? [];

  function getColor(pm: PaymentMethod) {
    return pm.color ?? TYPE_DEFAULT_COLORS[pm.type] ?? "#94a3b8";
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Formas de Pagamento"
        subtitle="Gerencie contas, cartões e formas de pagamento"
        right={
          <PrimaryButton onClick={() => {
            if (showForm) { setShowForm(false); setEditing(null); reset(); }
            else {
              setEditing(null);
              reset({ name: "", type: "", color: suggestPaletteColor(paymentMethods.map((pm) => pm.color)), bankId: "", closingDay: "", dueDay: "", supportsInstallments: false });
              setShowForm(true);
            }
          }}>
            <Plus size={15} />
            <span className="hidden sm:inline">Nova Forma</span>
          </PrimaryButton>
        }
      />

      <FormModal
        open={showForm}
        title={editing ? "Editar Forma de Pagamento" : "Nova Forma de Pagamento"}
        onClose={() => { setShowForm(false); setEditing(null); reset(); }}
        onSubmit={handleSubmit((d) => saveMutation.mutate(d))}
        submitLabel={editing ? "Salvar alterações" : "Criar forma de pagamento"}
        submitting={saveMutation.isPending}
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={formLabelCls}>Nome</label>
            <input
              {...register("name", { required: true })}
              className={formInputCls}
              placeholder="Ex: Nubank Crédito"
            />
          </div>
          <div>
            <label className={formLabelCls}>Tipo</label>
            <select {...register("type")} className={formInputCls}>
              <option value="">Selecionar...</option>
              {PAYMENT_METHOD_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={formLabelCls}>Cor</label>
          <ColorPicker
            value={watchedColor ?? COLOR_PALETTE[0]}
            onChange={(c) => setValue("color", c)}
            showSuggest={!editing}
            onSuggest={() => setValue("color", rotatePaletteColor(watchedColor))}
          />
        </div>

        <div>
          <label className={formLabelCls}>Banco vinculado (opcional)</label>
          <select {...register("bankId")} className={formInputCls}>
            <option value="">Sem banco vinculado</option>
            {banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>

        {watchedType === "credit_card" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={formLabelCls}>Dia de fechamento</label>
              <input
                {...register("closingDay")}
                type="number"
                min={1}
                max={31}
                className={formInputCls}
                placeholder="25"
              />
              <p className="text-[11px] text-[var(--text-faint)] mt-1">Dia em que a fatura fecha (1–31)</p>
            </div>
            <div>
              <label className={formLabelCls}>Dia de vencimento</label>
              <input
                {...register("dueDay")}
                type="number"
                min={1}
                max={31}
                className={formInputCls}
                placeholder="5"
              />
              <p className="text-[11px] text-[var(--text-faint)] mt-1">Dia em que a fatura deve ser paga (1–31)</p>
            </div>
          </div>
        )}

        <label className="flex items-center justify-between gap-3 p-3 rounded-[10px] border border-[var(--color-border)] bg-[var(--surface-raised)] cursor-pointer select-none">
          <div>
            <p className="text-[13px] font-medium text-[var(--color-text)]">Permite parcelamento</p>
            <p className="text-[11px] text-[var(--text-faint)] mt-0.5">Ao selecionar esta forma, o campo de parcelas abre em Novo Lançamento</p>
          </div>
          <input
            {...register("supportsInstallments")}
            type="checkbox"
            className="w-4 h-4 rounded border-[var(--color-border)] text-[#2563eb] focus:ring-[#3b82f6] shrink-0"
          />
        </label>
      </FormModal>

      <div className="bg-[var(--surface-card)] rounded-[14px] border border-[var(--color-border)] overflow-hidden">
        {isLoading ? <ListSkeleton rows={4} /> : (
        <div className="divide-y divide-[#f1f3f9]">
          {paymentMethods.length === 0 ? (
            <p className="px-6 py-12 text-[13px] text-app-muted text-center">Nenhuma forma de pagamento</p>
          ) : paymentMethods.map((pm) => {
            const color = getColor(pm);
            return (
              <div key={pm.id} className="flex items-center px-6 py-4 gap-4 hover:bg-[#f8f9fd] transition">
                <div
                  className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
                  style={{ backgroundColor: color + "20" }}
                >
                  <CreditCard size={18} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-app-text">{pm.name}</p>
                  <p className="text-[11px] text-app-muted">
                    {getPaymentMethodLabel(pm.type)}
                    {pm.type === "credit_card" && pm.closingDay && pm.dueDay && (
                      <span> · fecha dia {pm.closingDay}, vence dia {pm.dueDay}</span>
                    )}
                  </p>
                </div>
                {pm.isDefault && <span className="text-[10px] font-semibold text-[#3b82f6] bg-[rgba(59,130,246,.08)] px-1.5 py-0.5 rounded-full">Padrão</span>}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditing(pm);
                      reset({
                        name: pm.name,
                        type: pm.type,
                        color: pm.color ?? TYPE_DEFAULT_COLORS[pm.type] ?? COLOR_PALETTE[0],
                        bankId: pm.bankId ?? "",
                        closingDay: pm.closingDay?.toString() ?? "",
                        dueDay: pm.dueDay?.toString() ?? "",
                        supportsInstallments: pm.supportsInstallments,
                      });
                      setShowForm(true);
                    }}
                    className="p-1.5 text-app-muted hover:text-[#3b82f6] hover:bg-[rgba(59,130,246,.08)] rounded-[8px] transition"
                  >
                    <Edit size={14} />
                  </button>
                  {!pm.isDefault && (
                    <button
                      onClick={() => schedule(pm.id, `"${pm.name}" excluída`, async () => {
                        await fetch(`/api/payment-methods/${pm.id}`, { method: "DELETE" });
                        queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
                      })}
                      className="p-1.5 text-app-muted hover:text-expense hover:bg-[rgba(248,113,113,.1)] rounded-[8px] transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>

    </div>
  );
}
