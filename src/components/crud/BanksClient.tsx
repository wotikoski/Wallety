"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActiveGroup } from "@/lib/hooks/useActiveGroup";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useUndoDelete } from "@/lib/hooks/useUndoDelete";
import { Plus, Trash2, Edit, Building2 } from "lucide-react";
import { COLOR_PALETTE, ColorPicker, suggestPaletteColor, rotatePaletteColor } from "@/components/ui/ColorPicker";
import { getBankBrandColor } from "@/lib/utils/bank-colors";
import { PageHeader, PrimaryButton } from "@/components/layout/PageHeader";
import { FormModal, formInputCls, formLabelCls } from "@/components/ui/FormModal";

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
    queryFn: () => fetch(`/api/banks?${params}`).then((r) => { if (!r.ok) { return r.json().then((b) => { throw new Error(b?.error ?? `API ${r.status}`); }); } return r.json(); }),
  });

  const { schedule, isPending } = useUndoDelete();

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

  const banks = (data?.banks ?? []).filter((b) => !isPending(b.id));

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Bancos"
        subtitle="Gerencie seus bancos e instituições financeiras"
        right={
          <PrimaryButton
            onClick={() => {
              if (showForm) { setShowForm(false); setEditing(null); reset(); }
              else {
                setEditing(null);
                reset({ name: "", code: "", color: suggestPaletteColor(banks.map((b) => b.color)) });
                setShowForm(true);
              }
            }}
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Novo Banco</span>
          </PrimaryButton>
        }
      />

      <FormModal
        open={showForm}
        title={editing ? "Editar Banco" : "Novo Banco"}
        onClose={() => { setShowForm(false); setEditing(null); reset(); }}
        onSubmit={handleSubmit((d) => saveMutation.mutate(d))}
        submitLabel={editing ? "Salvar alterações" : "Criar banco"}
        submitting={saveMutation.isPending}
      >
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className={formLabelCls}>Nome do banco</label>
            <input
              {...nameReg}
              onChange={(e) => {
                nameReg.onChange(e);
                if (!editing) {
                  const brand = getBankBrandColor(e.target.value);
                  if (brand) setValue("color", brand);
                }
              }}
              className={formInputCls}
              placeholder="Ex: Nubank"
            />
          </div>
          <div>
            <label className={formLabelCls}>Código COMPE</label>
            <input
              {...register("code")}
              className={formInputCls}
              placeholder="260"
            />
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
      </FormModal>

      <div className="bg-[var(--surface-card)] rounded-[14px] border border-[var(--color-border)] overflow-hidden">
        {isLoading ? <ListSkeleton rows={4} /> : (
        <div className="divide-y divide-[#f1f3f9]">
          {banks.length === 0 ? (
            <p className="px-6 py-12 text-[13px] text-app-muted text-center">Nenhum banco cadastrado</p>
          ) : banks.map((bank) => (
            <div key={bank.id} className="flex items-center px-6 py-4 gap-4 hover:bg-[#f8f9fd] transition">
              <div
                className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
                style={{ backgroundColor: bank.color ? bank.color + "20" : "#f1f5f9" }}
              >
                <Building2 size={18} style={{ color: bank.color ?? "#64748b" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-app-text">{bank.name}</p>
                {bank.code && <p className="text-[11px] text-app-muted">Cód. {bank.code}</p>}
              </div>
              {bank.isDefault && <span className="text-[10px] font-semibold text-[#3b82f6] bg-[rgba(59,130,246,.08)] px-1.5 py-0.5 rounded-full">Padrão</span>}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setEditing(bank);
                    reset({ name: bank.name, code: bank.code ?? "", color: bank.color ?? COLOR_PALETTE[0] });
                    setShowForm(true);
                  }}
                  className="p-1.5 text-app-muted hover:text-[#3b82f6] hover:bg-[rgba(59,130,246,.08)] rounded-[8px] transition"
                >
                  <Edit size={14} />
                </button>
                {!bank.isDefault && (
                  <button
                    onClick={() => schedule(bank.id, `Banco "${bank.name}" excluído`, async () => {
                      await fetch(`/api/banks/${bank.id}`, { method: "DELETE" });
                      queryClient.invalidateQueries({ queryKey: ["banks"] });
                    })}
                    className="p-1.5 text-app-muted hover:text-expense hover:bg-[rgba(248,113,113,.1)] rounded-[8px] transition"
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

    </div>
  );
}
