"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActiveGroup } from "@/lib/hooks/useActiveGroup";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useConfirm } from "@/lib/hooks/useConfirm";
import { Plus, Trash2, Edit, Building2 } from "lucide-react";
import { COLOR_PALETTE, ColorPicker, suggestPaletteColor, rotatePaletteColor } from "@/components/ui/ColorPicker";
import { getBankBrandColor } from "@/lib/utils/bank-colors";

interface Bank {
  id: string;
  name: string;
  code: string | null;
  color: string | null;
  isDefault: boolean;
}

export function BanksClient() {
  const { activeGroupId } = useActiveGroup();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Bank | null>(null);

  const params = new URLSearchParams();
  if (activeGroupId) params.set("groupId", activeGroupId);

  const { data, isLoading } = useQuery<{ banks: Bank[] }>({
    queryKey: ["banks", "all", activeGroupId],
    queryFn: () => fetch(`/api/banks?${params}`).then((r) => r.json()),
  });

  const { confirm, dialogProps } = useConfirm();

  const { register, handleSubmit, reset, watch, setValue } = useForm<{ name: string; code: string; color: string }>({
    defaultValues: { color: COLOR_PALETTE[0] },
  });
  const watchedColor = watch("color");
  const nameReg = register("name", { required: true });

  const saveMutation = useMutation({
    mutationFn: async (d: { name: string; code: string; color: string }) => {
      const url = editing ? `/api/banks/${editing.id}` : "/api/banks";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...d, groupId: activeGroupId }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Erro ao salvar banco");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banks"] });
      toast({ title: editing ? "Banco atualizado!" : "Banco criado!" });
      reset();
      setShowForm(false);
      setEditing(null);
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/banks/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Erro ao excluir banco");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banks"] });
      toast({ title: "Banco excluído" });
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const banks = data?.banks ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold text-app-text tracking-tight">Bancos</h1>
          <p className="text-app-muted text-[13px] mt-0.5 font-medium">Gerencie seus bancos e instituições financeiras</p>
        </div>
        <button
          onClick={() => {
            if (showForm) { setShowForm(false); setEditing(null); reset(); }
            else {
              setEditing(null);
              reset({ name: "", code: "", color: suggestPaletteColor(banks.map((b) => b.color)) });
              setShowForm(true);
            }
          }}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-3.5 h-9 rounded-lg transition"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Novo Banco</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-app-text mb-4">{editing ? "Editar" : "Novo"} Banco</h2>
          <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-app-text mb-1.5">Nome do banco</label>
              <input
                {...nameReg}
                onChange={(e) => {
                  nameReg.onChange(e);
                  // Auto-match brand color as the user types (only for new banks).
                  if (!editing) {
                    const brand = getBankBrandColor(e.target.value);
                    if (brand) setValue("color", brand);
                  }
                }}
                className="w-full h-9 px-3.5 rounded-lg border border-app-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-[var(--surface-card)] text-app-text"
                placeholder="Ex: Nubank"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-app-text mb-1.5">Código COMPE</label>
              <input
                {...register("code")}
                className="w-full h-9 px-3.5 rounded-lg border border-app-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-[var(--surface-card)] text-app-text"
                placeholder="260"
              />
            </div>
            <div className="col-span-3">
              <ColorPicker
                value={watchedColor ?? COLOR_PALETTE[0]}
                onChange={(c) => setValue("color", c)}
                showSuggest={!editing}
                onSuggest={() => setValue("color", rotatePaletteColor(watchedColor))}
              />
            </div>
            <div className="col-span-3 flex gap-3 items-end">
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditing(null); }}
                className="flex-1 h-9 px-4 rounded-lg border border-app-border text-sm font-medium text-app-muted hover:bg-[var(--surface-raised)] hover:text-app-text transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="flex-1 h-9 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 rounded-lg transition disabled:opacity-50"
              >
                {saveMutation.isPending ? "Salvando..." : editing ? "Atualizar" : "Criar"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-[14px] border border-app-border shadow-card overflow-hidden">
        {isLoading ? <ListSkeleton rows={4} /> : (
        <div className="divide-y divide-[#f1f3f9]">
          {banks.length === 0 ? (
            <p className="px-6 py-12 text-[13px] text-app-muted text-center">Nenhum banco cadastrado</p>
          ) : banks.map((bank) => (
            <div key={bank.id} className="flex items-center px-6 py-4 gap-4 hover:bg-[#f8f9fd] transition">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: bank.color ? bank.color + "20" : "#f1f5f9" }}
              >
                <Building2 size={18} style={{ color: bank.color ?? "#64748b" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-app-text">{bank.name}</p>
                {bank.code && <p className="text-[11px] text-app-muted">Cód. {bank.code}</p>}
              </div>
              {bank.isDefault && <span className="text-[11px] text-app-muted bg-[var(--surface-raised)] px-2 py-0.5 rounded-full">Padrão</span>}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setEditing(bank);
                    reset({ name: bank.name, code: bank.code ?? "", color: bank.color ?? COLOR_PALETTE[0] });
                    setShowForm(true);
                  }}
                  className="p-1.5 text-app-muted hover:text-brand-500 hover:bg-[rgba(99,102,241,.08)] rounded-lg transition"
                >
                  <Edit size={14} />
                </button>
                {!bank.isDefault && (
                  <button
                    onClick={() => confirm(() => deleteMutation.mutate(bank.id), {
                      title: "Excluir banco",
                      description: `Tem certeza que deseja excluir o banco "${bank.name}"? Essa ação não pode ser desfeita.`,
                      confirmLabel: "Excluir",
                    })}
                    className="p-1.5 text-app-muted hover:text-expense hover:bg-[rgba(248,113,113,.1)] rounded-lg transition"
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
