"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActiveGroup } from "@/lib/hooks/useActiveGroup";
import { formatCurrency, parseCurrency } from "@/lib/utils/currency";
import { useToast } from "@/components/ui/use-toast";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useConfirm } from "@/lib/hooks/useConfirm";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Plus, RefreshCcw, Trash2, Play, Pencil } from "lucide-react";
import { useState } from "react";

interface Category {
  id: string;
  name: string;
  type: string;
  color: string | null;
  icon: string | null;
}

interface Recurring {
  id: string;
  type: "income" | "expense";
  description: string;
  value: string;
  categoryId: string | null;
  frequency: "monthly" | "weekly" | "yearly";
  dayOfMonth: string | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  lastGeneratedDate: string | null;
}

const FREQ_LABEL: Record<string, string> = {
  monthly: "Mensal",
  weekly: "Semanal",
  yearly: "Anual",
};

export function RecurringClient() {
  const { activeGroupId } = useActiveGroup();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { confirm, dialogProps } = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<Recurring | null>(null);

  const params = new URLSearchParams();
  if (activeGroupId) params.set("groupId", activeGroupId);

  const { data, isLoading } = useQuery<{ recurring: Recurring[] }>({
    queryKey: ["recurring", activeGroupId],
    queryFn: () => fetch(`/api/recurring?${params}`).then((r) => r.json()),
  });

  const { data: catsData } = useQuery<{ categories: Category[] }>({
    queryKey: ["categories", "all", activeGroupId],
    queryFn: () => fetch(`/api/categories?${params}`).then((r) => r.json()),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/recurring/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao remover");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["recurring-projected"] });
      toast({ title: "Recorrência e lançamentos removidos" });
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async (v: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/recurring/${v.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: v.isActive }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recurring"] }),
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const materializeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/recurring/materialize`, { method: "POST" });
      if (!res.ok) throw new Error("Erro ao gerar lançamentos");
      return res.json() as Promise<{ created: number }>;
    },
    onSuccess: (d) => {
      queryClient.invalidateQueries({ queryKey: ["recurring"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({ title: d.created > 0 ? `${d.created} lançamento(s) gerado(s)` : "Nada pendente" });
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const rows = data?.recurring ?? [];
  const categories = catsData?.categories ?? [];
  const catMap = new Map(categories.map((c) => [c.id, c]));

  function openNew() {
    setEditingRule(null);
    setShowForm(true);
  }

  function openEdit(r: Recurring) {
    setEditingRule(r);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingRule(null);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Recorrências</h1>
          <p className="text-slate-500 text-sm mt-0.5">Modelos que geram lançamentos automaticamente</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => materializeMutation.mutate()}
            disabled={materializeMutation.isPending}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-60"
          >
            <Play size={14} />
            {materializeMutation.isPending ? "Gerando..." : "Gerar pendentes"}
          </button>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700"
          >
            <Plus size={14} />
            Nova recorrência
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <ListSkeleton rows={4} />
        ) : rows.length === 0 ? (
          <p className="px-6 py-12 text-sm text-slate-400 text-center">Nenhuma recorrência cadastrada</p>
        ) : (
          <div className="divide-y divide-slate-50">
            {rows.map((r) => {
              const cat = r.categoryId ? catMap.get(r.categoryId) : null;
              return (
                <div key={r.id} className="px-4 py-4 flex items-center gap-3">
                  {/* Category icon */}
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-sm"
                    style={{ backgroundColor: cat?.color ? cat.color + "22" : "#f1f5f9" }}
                  >
                    {cat?.icon || <RefreshCcw size={14} className="text-slate-500" />}
                  </div>

                  {/* Description + metadata */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{r.description}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {FREQ_LABEL[r.frequency]}
                      {r.frequency === "monthly" && r.dayOfMonth && ` · dia ${r.dayOfMonth === "last" ? "último" : r.dayOfMonth}`}
                      {" · desde "}{r.startDate}
                      {r.endDate && ` até ${r.endDate}`}
                      {cat && ` · ${cat.name}`}
                    </p>
                  </div>

                  {/* Value */}
                  <span className={`text-sm font-mono font-semibold shrink-0 ${r.type === "income" ? "text-income" : "text-expense"}`}>
                    {r.type === "income" ? "+" : "-"}{formatCurrency(r.value)}
                  </span>

                  {/* Active toggle */}
                  <button
                    onClick={() => toggleMutation.mutate({ id: r.id, isActive: !r.isActive })}
                    className={`shrink-0 text-xs px-2.5 py-1 rounded-full border ${
                      r.isActive
                        ? "bg-income-light text-income border-income/20"
                        : "bg-slate-50 text-slate-400 border-slate-200"
                    }`}
                  >
                    {r.isActive ? "Ativa" : "Pausada"}
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => openEdit(r)}
                    className="shrink-0 px-2 py-1 text-xs font-medium text-brand-600 bg-brand-50 border border-brand-200 rounded-lg hover:bg-brand-100 transition"
                  >
                    Editar
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() =>
                      confirm(() => deleteMutation.mutate(r.id), {
                        title: "Remover recorrência?",
                        description: "A regra e todos os lançamentos gerados por ela serão removidos.",
                        variant: "danger",
                      })
                    }
                    className="shrink-0 p-1.5 text-slate-400 hover:text-expense hover:bg-expense-light rounded-lg transition"
                    title="Remover"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <RecurringForm
          categories={categories}
          groupId={activeGroupId ?? null}
          editing={editingRule}
          onClose={closeForm}
          onSaved={(wasEditing) => {
            closeForm();
            queryClient.invalidateQueries({ queryKey: ["recurring"] });
            queryClient.invalidateQueries({ queryKey: ["recurring-projected"] });
            queryClient.invalidateQueries({ queryKey: ["recurring-projected-budgets"] });
            queryClient.invalidateQueries({ queryKey: ["recurring-projected-calendar"] });
            toast({ title: wasEditing ? "Recorrência atualizada!" : "Recorrência criada!" });
            if (!wasEditing) {
              if (typeof window !== "undefined") {
                sessionStorage.removeItem("recurring_materialized_at");
              }
              materializeMutation.mutate();
            }
          }}
          onError={(msg) => toast({ title: "Erro", description: msg, variant: "destructive" })}
        />
      )}

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}

function RecurringForm({
  categories,
  groupId,
  editing,
  onClose,
  onSaved,
  onError,
}: {
  categories: Category[];
  groupId: string | null;
  editing: Recurring | null;
  onClose: () => void;
  onSaved: (wasEditing: boolean) => void;
  onError: (msg: string) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [type, setType] = useState<"income" | "expense">(editing?.type ?? "expense");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [valueStr, setValueStr] = useState(
    editing ? String(parseFloat(editing.value)).replace(".", ",") : "",
  );
  const [categoryId, setCategoryId] = useState<string>(editing?.categoryId ?? "");
  const [frequency, setFrequency] = useState<"monthly" | "weekly" | "yearly">(
    editing?.frequency ?? "monthly",
  );
  const [dayOfMonth, setDayOfMonth] = useState<string>(
    editing?.dayOfMonth ?? String(new Date().getDate()),
  );
  const [startDate, setStartDate] = useState(editing?.startDate ?? today);
  const [endDate, setEndDate] = useState(editing?.endDate ?? "");
  const [saving, setSaving] = useState(false);

  const filteredCats = categories.filter((c) => c.type === type || c.type === "both");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseCurrency(valueStr);
    if (!description.trim() || !value || value <= 0) {
      onError("Preencha descrição e valor");
      return;
    }
    setSaving(true);
    try {
      const url = editing ? `/api/recurring/${editing.id}` : "/api/recurring";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          description: description.trim(),
          value,
          categoryId: categoryId || null,
          frequency,
          dayOfMonth: frequency === "monthly" ? dayOfMonth : null,
          startDate,
          endDate: endDate || null,
          groupId: groupId ?? undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erro ao salvar");
      }
      onSaved(!!editing);
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4"
      >
        <h2 className="text-lg font-semibold text-slate-900">
          {editing ? "Editar recorrência" : "Nova recorrência"}
        </h2>

        <div className="flex gap-2">
          {(["expense", "income"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 px-3 py-2 text-sm rounded-lg border ${
                type === t
                  ? t === "expense"
                    ? "bg-expense-light text-expense border-expense/30 font-medium"
                    : "bg-income-light text-income border-income/30 font-medium"
                  : "bg-white text-slate-500 border-slate-200"
              }`}
            >
              {t === "expense" ? "Despesa" : "Receita"}
            </button>
          ))}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Descrição</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Ex: Aluguel"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Valor</label>
            <input
              type="text"
              inputMode="decimal"
              value={valueStr}
              onChange={(e) => setValueStr(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="0,00"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Categoria</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="">—</option>
              {filteredCats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Frequência</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as "monthly" | "weekly" | "yearly")}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="monthly">Mensal</option>
              <option value="weekly">Semanal</option>
              <option value="yearly">Anual</option>
            </select>
          </div>
          {frequency === "monthly" && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Dia do mês</label>
              <select
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={String(d)}>
                    {d}
                  </option>
                ))}
                <option value="last">Último</option>
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Início</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Fim (opcional)</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? "Salvando..." : editing ? "Atualizar" : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
