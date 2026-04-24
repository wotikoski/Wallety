"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActiveGroup } from "@/lib/hooks/useActiveGroup";
import { formatCurrency, parseCurrency } from "@/lib/utils/currency";
import { useToast } from "@/components/ui/use-toast";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useConfirm } from "@/lib/hooks/useConfirm";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Plus, RefreshCcw, Trash2, Play, Edit, CheckCircle2, Circle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useState } from "react";
import { SwipeableRow } from "@/components/transactions/SwipeableRow";

// "2026-02-17" → "17/02/2026"
function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

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
            title="Gerar pendentes"
            className="inline-flex items-center gap-2 px-3.5 h-9 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-60"
          >
            <Play size={14} />
            <span className="hidden sm:inline">
              {materializeMutation.isPending ? "Gerando..." : "Gerar pendentes"}
            </span>
          </button>
          {/* "Nova recorrência" button — hidden on mobile (FAB is used instead) */}
          <button
            onClick={openNew}
            title="Nova recorrência"
            className="hidden sm:inline-flex items-center gap-2 px-3.5 h-9 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700"
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
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">🔁</div>
            <p className="text-slate-500 text-sm">Nenhuma recorrência cadastrada</p>
            <button onClick={openNew} className="mt-3 inline-flex items-center gap-1 text-brand-600 text-sm font-medium hover:text-brand-700">
              <Plus size={14} /> Criar primeira recorrência
            </button>
          </div>
        ) : (
          <>
            {/* Mobile card view */}
            <div className="md:hidden divide-y divide-slate-50">
              {rows.map((r) => {
                const cat = r.categoryId ? catMap.get(r.categoryId) : null;
                return (
                  <SwipeableRow
                    key={r.id}
                    actions={
                      <div className="flex h-full w-full">
                        <button
                          onClick={() => openEdit(r)}
                          className="flex-1 flex flex-col items-center justify-center gap-1 bg-brand-600 text-white text-xs font-medium"
                        >
                          <Edit size={16} />
                          Editar
                        </button>
                        <button
                          onClick={() => confirm(() => deleteMutation.mutate(r.id), { title: "Remover recorrência?", description: "A regra e todos os lançamentos gerados por ela serão removidos.", variant: "danger" })}
                          className="flex-1 flex flex-col items-center justify-center gap-1 bg-expense text-white text-xs font-medium"
                        >
                          <Trash2 size={16} />
                          Excluir
                        </button>
                      </div>
                    }
                  >
                    <div className="px-4 py-3.5 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${r.type === "income" ? "bg-income-light" : "bg-expense-light"}`}>
                        {r.type === "income"
                          ? <ArrowUpRight size={14} className="text-income" />
                          : <ArrowDownRight size={14} className="text-expense" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{r.description}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {FREQ_LABEL[r.frequency]}
                          {r.frequency === "monthly" && r.dayOfMonth && ` · dia ${r.dayOfMonth === "last" ? "último" : r.dayOfMonth}`}
                          {cat && ` · ${cat.name}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <p className={`text-sm font-semibold font-mono ${r.type === "income" ? "text-income" : "text-expense"}`}>
                            {r.type === "income" ? "+" : "-"}{formatCurrency(r.value)}
                          </p>
                          <span className={`text-xs ${r.isActive ? "text-income" : "text-slate-400"}`}>
                            {r.isActive ? "Ativa" : "Pausada"}
                          </span>
                        </div>
                        <button
                          onClick={() => toggleMutation.mutate({ id: r.id, isActive: !r.isActive })}
                          className="text-slate-400 hover:text-income transition"
                        >
                          {r.isActive ? <CheckCircle2 size={18} className="text-income" /> : <Circle size={18} />}
                        </button>
                      </div>
                    </div>
                  </SwipeableRow>
                );
              })}
            </div>

            {/* Desktop table view */}
            <table className="hidden md:table w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Descrição</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Frequência</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Início</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Valor</th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Ativa</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((r) => {
                  const cat = r.categoryId ? catMap.get(r.categoryId) : null;
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition">
                      {/* Descrição */}
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${r.type === "income" ? "bg-income-light" : "bg-expense-light"}`}>
                            {r.type === "income"
                              ? <ArrowUpRight size={12} className="text-income" />
                              : <ArrowDownRight size={12} className="text-expense" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{r.description}</p>
                            {cat && <p className="text-xs text-slate-400 truncate">{cat.icon} {cat.name}</p>}
                          </div>
                        </div>
                      </td>
                      {/* Frequência */}
                      <td className="px-6 py-3.5 text-sm text-slate-500 whitespace-nowrap">
                        {FREQ_LABEL[r.frequency]}
                        {r.frequency === "monthly" && r.dayOfMonth && (
                          <span className="text-slate-400"> · dia {r.dayOfMonth === "last" ? "último" : r.dayOfMonth}</span>
                        )}
                      </td>
                      {/* Início */}
                      <td className="px-6 py-3.5 text-sm text-slate-500 whitespace-nowrap">
                        {fmtDate(r.startDate)}
                        {r.endDate && <p className="text-xs text-slate-400">até {fmtDate(r.endDate)}</p>}
                      </td>
                      {/* Valor */}
                      <td className="px-6 py-3.5 text-right">
                        <span className={`text-sm font-semibold font-mono ${r.type === "income" ? "text-income" : "text-expense"}`}>
                          {r.type === "income" ? "+" : "-"}{formatCurrency(r.value)}
                        </span>
                      </td>
                      {/* Ativa */}
                      <td className="px-6 py-3.5 text-center">
                        <button onClick={() => toggleMutation.mutate({ id: r.id, isActive: !r.isActive })} className="text-slate-400 hover:text-income transition">
                          {r.isActive ? <CheckCircle2 size={18} className="text-income" /> : <Circle size={18} />}
                        </button>
                      </td>
                      {/* Ações */}
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(r)}
                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                            title="Editar"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => confirm(() => deleteMutation.mutate(r.id), { title: "Remover recorrência?", description: "A regra e todos os lançamentos gerados por ela serão removidos.", variant: "danger" })}
                            className="p-1.5 text-slate-400 hover:text-expense hover:bg-expense-light rounded-lg transition"
                            title="Remover"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
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

      {/* FAB — mobile only, above the bottom nav */}
      <button
        onClick={openNew}
        title="Nova recorrência"
        aria-label="Nova recorrência"
        className="md:hidden fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center shadow-lg transition"
      >
        <Plus size={24} />
      </button>
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
  // When startDate changes on a NEW rule (not editing), sync dayOfMonth to the
  // chosen day so the user doesn't have to update two fields manually.
  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (!editing && val) {
      const day = parseInt(val.split("-")[2], 10);
      if (!isNaN(day)) setDayOfMonth(String(day));
    }
  };
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
              className={`flex-1 h-9 px-3 text-sm rounded-lg border ${
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
            className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
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
              className="w-full h-9 px-3 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="0,00"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Categoria</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
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
              className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
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
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={String(d)}>
                    {d}
                  </option>
                ))}
                <option value="last">Último</option>
              </select>
              {(parseInt(dayOfMonth) >= 29 || dayOfMonth === "last") && (
                <p className="text-[10px] text-slate-400 mt-1">
                  Em meses com menos dias, usa o último dia do mês.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Início</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Fim (opcional)</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-9 px-4 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 h-9 px-4 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? "Salvando..." : editing ? "Atualizar" : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
