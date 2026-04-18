"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActiveGroup } from "@/lib/hooks/useActiveGroup";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, Edit, Building2 } from "lucide-react";

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

  const { data } = useQuery<{ banks: Bank[] }>({
    queryKey: ["banks", "all", activeGroupId],
    queryFn: () => fetch(`/api/banks?${params}`).then((r) => r.json()),
  });

  const { register, handleSubmit, reset } = useForm<{ name: string; code: string; color: string }>();

  const saveMutation = useMutation({
    mutationFn: async (d: { name: string; code: string; color: string }) => {
      const url = editing ? `/api/banks/${editing.id}` : "/api/banks";
      const method = editing ? "PUT" : "POST";
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...d, groupId: activeGroupId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banks"] });
      toast({ title: editing ? "Banco atualizado!" : "Banco criado!" });
      reset();
      setShowForm(false);
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/banks/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banks"] });
      toast({ title: "Banco excluído" });
    },
  });

  const banks = data?.banks ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Bancos</h1>
          <p className="text-slate-500 text-sm mt-0.5">Gerencie seus bancos e instituições financeiras</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditing(null); reset(); }}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
        >
          <Plus size={16} />
          Novo Banco
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800 mb-4">{editing ? "Editar" : "Novo"} Banco</h2>
          <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome do banco</label>
              <input
                {...register("name", { required: true })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Ex: Nubank"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Código COMPE</label>
              <input
                {...register("code")}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="260"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Cor</label>
              <input {...register("color")} type="color" className="w-full h-10 rounded-lg border border-slate-200 cursor-pointer" />
            </div>
            <div className="col-span-2 flex gap-3 items-end">
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditing(null); }}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="flex-1 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition disabled:opacity-50"
              >
                {saveMutation.isPending ? "Salvando..." : editing ? "Atualizar" : "Criar"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-50">
          {banks.length === 0 ? (
            <p className="px-6 py-12 text-sm text-slate-400 text-center">Nenhum banco cadastrado</p>
          ) : banks.map((bank) => (
            <div key={bank.id} className="flex items-center px-6 py-4 gap-4 hover:bg-slate-50/50 transition">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: bank.color ? bank.color + "20" : "#f1f5f9" }}
              >
                <Building2 size={18} style={{ color: bank.color ?? "#64748b" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">{bank.name}</p>
                {bank.code && <p className="text-xs text-slate-400">Cód. {bank.code}</p>}
              </div>
              {bank.isDefault && <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Padrão</span>}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setEditing(bank);
                    reset({ name: bank.name, code: bank.code ?? "", color: bank.color ?? "#6173f4" });
                    setShowForm(true);
                  }}
                  className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                >
                  <Edit size={14} />
                </button>
                {!bank.isDefault && (
                  <button
                    onClick={() => confirm("Excluir banco?") && deleteMutation.mutate(bank.id)}
                    className="p-1.5 text-slate-400 hover:text-expense hover:bg-expense-light rounded-lg transition"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
