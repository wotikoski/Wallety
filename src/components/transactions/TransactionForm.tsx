"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { transactionSchema, TransactionInput } from "@/lib/validations/transaction";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActiveGroup } from "@/lib/hooks/useActiveGroup";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { PAYMENT_METHOD_TYPES } from "@/lib/constants/payment-method-types";
import { X } from "lucide-react";

interface Props {
  onClose?: () => void;
  transaction?: {
    id: string;
    date: string;
    type: string;
    categoryId: string | null;
    description: string;
    value: string;
    paymentMethodId: string | null;
    bankId: string | null;
    installmentTotal: number | null;
    installmentValue: string | null;
    isPaid: boolean;
    isFixed: boolean;
    notes: string | null;
  };
}

export function TransactionForm({ transaction, onClose }: Props) {
  const { activeGroupId } = useActiveGroup();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isEdit = !!transaction;

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      date: transaction?.date ?? new Date().toISOString().split("T")[0],
      type: (transaction?.type as "income" | "expense") ?? "expense",
      categoryId: transaction?.categoryId ?? null,
      description: transaction?.description ?? "",
      value: transaction ? parseFloat(transaction.value) : (undefined as unknown as number),
      paymentMethodId: transaction?.paymentMethodId ?? null,
      bankId: transaction?.bankId ?? null,
      installmentTotal: transaction?.installmentTotal ?? null,
      installmentValue: transaction?.installmentValue ? parseFloat(transaction.installmentValue) : null,
      isPaid: transaction?.isPaid ?? false,
      isFixed: transaction?.isFixed ?? false,
      groupId: activeGroupId ?? null,
      notes: transaction?.notes ?? null,
    },
  });

  // If fresh data arrives after the form already mounted (cached-first fetch),
  // reset the form so the user edits the current state, not a stale snapshot.
  useEffect(() => {
    if (!transaction) return;
    reset({
      date: transaction.date,
      type: transaction.type as "income" | "expense",
      categoryId: transaction.categoryId,
      description: transaction.description,
      value: parseFloat(transaction.value),
      paymentMethodId: transaction.paymentMethodId,
      bankId: transaction.bankId,
      installmentTotal: transaction.installmentTotal,
      installmentValue: transaction.installmentValue ? parseFloat(transaction.installmentValue) : null,
      isPaid: transaction.isPaid,
      isFixed: transaction.isFixed,
      groupId: activeGroupId ?? null,
      notes: transaction.notes,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    transaction?.id,
    transaction?.date,
    transaction?.value,
    transaction?.description,
    transaction?.categoryId,
    transaction?.paymentMethodId,
    transaction?.bankId,
    transaction?.installmentTotal,
    transaction?.installmentValue,
    transaction?.isPaid,
    transaction?.isFixed,
    transaction?.notes,
    transaction?.type,
  ]);

  const type = watch("type");
  const value = watch("value");
  const installmentTotal = watch("installmentTotal");

  // Auto-calculate installment value
  useEffect(() => {
    if (installmentTotal && installmentTotal > 1 && value) {
      setValue("installmentValue", Math.round((value / installmentTotal) * 100) / 100);
    }
  }, [value, installmentTotal, setValue]);

  const { data: categoriesData } = useQuery({
    queryKey: ["categories", type, activeGroupId],
    queryFn: () => {
      const p = new URLSearchParams({ type });
      if (activeGroupId) p.set("groupId", activeGroupId);
      return fetch(`/api/categories?${p}`).then((r) => r.json());
    },
  });

  const { data: banksData } = useQuery({
    queryKey: ["banks", activeGroupId],
    queryFn: () => {
      const p = new URLSearchParams();
      if (activeGroupId) p.set("groupId", activeGroupId);
      return fetch(`/api/banks?${p}`).then((r) => r.json());
    },
  });

  const { data: pmData } = useQuery({
    queryKey: ["paymentMethods", activeGroupId],
    queryFn: () => {
      const p = new URLSearchParams();
      if (activeGroupId) p.set("groupId", activeGroupId);
      return fetch(`/api/payment-methods?${p}`).then((r) => r.json());
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: TransactionInput) => {
      const url = isEdit ? `/api/transactions/${transaction.id}` : "/api/transactions";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, groupId: activeGroupId }),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      return res.json();
    },
    onSuccess: () => {
      // A transaction change ripples into every derived view � invalidate
      // every query that reads from transactions, plus the single-row cache
      // so the next edit page opens with fresh data.
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transactions-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["report"] });
      queryClient.invalidateQueries({ queryKey: ["daily-limit"] });
      if (isEdit && transaction) {
        queryClient.invalidateQueries({ queryKey: ["transaction", transaction.id] });
      }
      toast({ title: isEdit ? "Lançamento atualizado!" : "Lançamento criado!" });
      if (onClose) {
        onClose();
      } else {
        router.refresh();
        router.push("/lancamentos");
      }
    },
    onError: () => {
      toast({ title: "Erro ao salvar lançamento", variant: "destructive" });
    },
  });

  const categories = categoriesData?.categories ?? [];
  const banks = banksData?.banks ?? [];
  const paymentMethods = pmData?.paymentMethods ?? [];

  return (
    <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="bg-white rounded-[14px] border border-app-border shadow-card p-6 space-y-5">
      {onClose && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-app-text">Novo Lançamento</h2>
          <button type="button" onClick={onClose} className="p-1 text-app-muted hover:text-app-text rounded-lg transition">
            <X size={18} />
          </button>
        </div>
      )}
      {/* Type toggle */}
      <div>
        <label className="block text-xs font-medium text-app-muted mb-1">Tipo</label>
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <div className="flex gap-2">
              {(["expense", "income"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => field.onChange(t)}
                  className={`flex-1 h-9 px-3 text-sm rounded-lg border transition font-medium ${
                    field.value === t
                      ? t === "expense"
                        ? "bg-[rgba(248,113,113,.15)] text-expense border-[rgba(248,113,113,.3)] font-semibold"
                        : "bg-[rgba(16,185,129,.15)] text-income border-[rgba(16,185,129,.3)] font-semibold"
                      : "bg-[var(--surface-raised)] text-app-muted border-app-border"
                  }`}
                >
                  {t === "expense" ? "Despesa" : "Receita"}
                </button>
              ))}
            </div>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-app-text mb-1.5">Data</label>
          <input
            {...register("date")}
            type="date"
            className="w-full h-9 px-3.5 rounded-lg border border-app-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-[var(--surface-card)] text-app-text"
          />
          {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-app-text mb-1.5">Categoria</label>
          {/* Controlled so the rendered value always tracks RHF state, even
              when the categories list loads asynchronously after mount. */}
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <select
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value)}
                onBlur={field.onBlur}
                className="w-full h-9 px-3.5 rounded-lg border border-app-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-[var(--surface-card)] text-app-text"
              >
                <option value="">Sem categoria</option>
                {categories.map((c: { id: string; name: string; icon: string }) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-app-text mb-1.5">Descrição</label>
        <input
          {...register("description")}
          type="text"
          placeholder="Ex: Supermercado Extrabom"
          className="w-full h-9 px-3.5 rounded-lg border border-app-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-[var(--surface-card)] text-app-text"
        />
        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-app-text mb-1.5">Valor total (R$)</label>
          <input
            {...register("value", { valueAsNumber: true })}
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            className="w-full h-9 px-3.5 rounded-lg border border-app-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-[var(--surface-card)] text-app-text font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          {errors.value && <p className="text-red-500 text-xs mt-1">{errors.value.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-app-text mb-1.5">Forma de Pagamento</label>
          <Controller
            control={control}
            name="paymentMethodId"
            render={({ field }) => (
              <select
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value)}
                onBlur={field.onBlur}
                className="w-full h-9 px-3.5 rounded-lg border border-app-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-[var(--surface-card)] text-app-text"
              >
                <option value="">Selecionar...</option>
                {paymentMethods.map((pm: { id: string; name: string; type: string }) => (
                  <option key={pm.id} value={pm.id}>{pm.name}</option>
                ))}
              </select>
            )}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-app-text mb-1.5">Banco</label>
        <Controller
          control={control}
          name="bankId"
          render={({ field }) => (
            <select
              value={field.value ?? ""}
              onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value)}
              onBlur={field.onBlur}
              className="w-full h-9 px-3.5 rounded-lg border border-app-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-[var(--surface-card)] text-app-text"
            >
              <option value="">Sem banco</option>
              {banks.map((b: { id: string; name: string }) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}
        />
      </div>

      {/* Installments */}
      <div className="p-4 bg-[var(--surface-raised)] rounded-lg border border-app-border space-y-4">
        <p className="text-sm font-medium text-app-text">Parcelamento</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Nº de parcelas</label>
            <input
              {...register("installmentTotal", { valueAsNumber: true })}
              type="number"
              min="1"
              max="120"
              placeholder="1 = à vista"
              className="w-full h-9 px-3 rounded-lg border border-app-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-[var(--surface-card)] text-app-text"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Valor da parcela (R$)</label>
            <input
              {...register("installmentValue", { valueAsNumber: true })}
              type="number"
              step="0.01"
              placeholder="Calculado automaticamente"
              readOnly={!!installmentTotal && installmentTotal > 1}
              className="w-full h-9 px-3 rounded-lg border border-app-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-[var(--surface-hover)] text-app-muted font-mono"
            />
          </div>
        </div>
        {installmentTotal && installmentTotal > 1 && value && (
          <p className="text-xs text-brand-600">
            {installmentTotal}x de {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value / installmentTotal)}
          </p>
        )}
      </div>

      {/* Flags */}
      <div className="flex gap-6">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            {...register("isPaid")}
            type="checkbox"
            className="w-4 h-4 rounded border-app-border text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm text-app-text">Marcar como pago</span>
        </label>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            {...register("isFixed")}
            type="checkbox"
            className="w-4 h-4 rounded border-app-border text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm text-app-text">Custo fixo</span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-app-text mb-1.5">Notas (opcional)</label>
        <textarea
          {...register("notes")}
          rows={2}
          placeholder="Alguma observação..."
          className="w-full px-3.5 py-2 rounded-lg border border-app-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-[var(--surface-card)] text-app-text resize-none"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => onClose ? onClose() : router.back()}
          className="flex-1 h-9 px-4 rounded-lg border border-app-border text-sm font-medium text-app-muted hover:bg-[var(--surface-raised)] hover:text-app-text transition"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="flex-1 h-9 bg-brand-600 hover:bg-brand-700 text-white font-medium px-4 rounded-lg text-sm transition disabled:opacity-50"
        >
          {saveMutation.isPending ? "Salvando..." : isEdit ? "Atualizar" : "Salvar"}
        </button>
      </div>
    </form>
  );
}
