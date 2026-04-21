"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActiveGroup } from "@/lib/hooks/useActiveGroup";
import { formatCurrency } from "@/lib/utils/currency";
import { useState } from "react";
import { ChevronLeft, ChevronRight, AlertTriangle, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ListSkeleton } from "@/components/ui/Skeleton";

interface Category {
  id: string;
  name: string;
  type: string;
  color: string | null;
  icon: string | null;
}

interface Budget {
  id: string;
  categoryId: string;
  year: number;
  month: number;
  amount: string;
  spent: number;
  category: { name: string; color: string | null; icon: string | null } | null;
}

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function BudgetsClient() {
  const { activeGroupId } = useActiveGroup();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const budgetParams = new URLSearchParams({ year: String(year), month: String(month) });
  if (activeGroupId) budgetParams.set("groupId", activeGroupId);

  const { data: budgetsData, isLoading } = useQuery<{ budgets: Budget[] }>({
    queryKey: ["budgets", year, month, activeGroupId],
    queryFn: () => fetch(`/api/budgets?${budgetParams}`).then((r) => r.json()),
  });

  // Projected recurring expenses for this month. We bucket by the invoice
  // effective date (credit cards) to match how /api/budgets computes spent.
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEndDay = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(monthEndDay).padStart(2, "0")}`;
  const projParams = new URLSearchParams({ from: monthStart, to: monthEnd });
  if (activeGroupId) projParams.set("groupId", activeGroupId);

  const { data: projData } = useQuery<{
    projected: { categoryId: string | null; type: string; value: string; date: string; effectiveDate: string | null }[];
  }>({
    queryKey: ["recurring-projected-budgets", year, month, activeGroupId],
    queryFn: () => fetch(`/api/recurring/projected?${projParams}`).then((r) => r.json()),
  });

  // Sum projected expenses per category for the visible month (bucketed by
  // effective date so invoices land in the right month).
  const projectedByCat = new Map<string, number>();
  for (const p of projData?.projected ?? []) {
    if (p.type !== "expense" || !p.categoryId) continue;
    const bucket = p.effectiveDate ?? p.date;
    if (bucket < monthStart || bucket > monthEnd) continue;
    projectedByCat.set(p.categoryId, (projectedByCat.get(p.categoryId) ?? 0) + parseFloat(p.value));
  }

  const catParams = new URLSearchParams();
  if (activeGroupId) catParams.set("groupId", activeGroupId);
  const { data: catsData } = useQuery<{ categories: Category[] }>({
    queryKey: ["categories", "all", activeGroupId],
    queryFn: () => fetch(`/api/categories?${catParams}`).then((r) => r.json()),
  });

  const saveMutation = useMutation({
    mutationFn: async (d: { categoryId: string; amount: number }) => {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: d.categoryId,
          amount: d.amount,
          year,
          month,
          groupId: activeGroupId ?? undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Erro ao salvar");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["budgets"] }),
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao remover");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast({ title: "Orçamento removido" });
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const budgets = budgetsData?.budgets ?? [];
  const expenseCategories = (catsData?.categories ?? []).filter((c) => c.type === "expense" || c.type === "both");

  // Merge: for every expense category, either show its budget or an empty slot.
  const rows = expenseCategories.map((cat) => {
    const existing = budgets.find((b) => b.categoryId === cat.id);
    return { category: cat, budget: existing };
  });

  const totalPlanned = budgets.reduce((acc, b) => acc + parseFloat(b.amount), 0);
  const totalSpent = budgets.reduce((acc, b) => acc + b.spent, 0);
  const totalProjected = budgets.reduce((acc, b) => acc + (projectedByCat.get(b.categoryId) ?? 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Orçamentos</h1>
        <p className="text-slate-500 text-sm mt-0.5">Defina um teto mensal de gastos por categoria</p>
      </div>

      {/* Month navigator */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex items-center justify-between">
        <button
          onClick={() => {
            if (month === 1) { setMonth(12); setYear(year - 1); }
            else setMonth(month - 1);
          }}
          className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-sm font-medium text-slate-800">{MONTHS[month - 1]} {year}</div>
        <button
          onClick={() => {
            if (month === 12) { setMonth(1); setYear(year + 1); }
            else setMonth(month + 1);
          }}
          className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
          <p className="text-xs text-slate-500 mb-1">Total orçado</p>
          <p className="text-xl font-bold text-slate-900 font-mono">{formatCurrency(totalPlanned)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
          <p className="text-xs text-slate-500 mb-1">Total gasto</p>
          <p className={`text-xl font-bold font-mono ${totalSpent > totalPlanned && totalPlanned > 0 ? "text-expense" : "text-slate-900"}`}>
            {formatCurrency(totalSpent)}
          </p>
          {totalProjected > 0 && (
            <p className="text-xs text-slate-400 mt-1">
              + <span className="font-mono font-medium text-slate-500">{formatCurrency(totalProjected)}</span> previsto
            </p>
          )}
        </div>
      </div>

      {/* Categories list */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? <ListSkeleton rows={6} /> : (
          <div className="divide-y divide-slate-50">
            {rows.length === 0 ? (
              <p className="px-6 py-12 text-sm text-slate-400 text-center">Nenhuma categoria de despesa cadastrada</p>
            ) : rows.map(({ category, budget }) => (
              <BudgetRow
                key={category.id}
                category={category}
                budget={budget}
                projected={projectedByCat.get(category.id) ?? 0}
                onSave={(amount) => saveMutation.mutate({ categoryId: category.id, amount })}
                onDelete={budget ? () => deleteMutation.mutate(budget.id) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BudgetRow({
  category, budget, projected, onSave, onDelete,
}: {
  category: Category;
  budget?: Budget;
  projected: number;
  onSave: (amount: number) => void;
  onDelete?: () => void;
}) {
  const planned = budget ? parseFloat(budget.amount) : 0;
  const spent = budget?.spent ?? 0;
  const pct = planned > 0 ? (spent / planned) * 100 : 0;
  const projectedPct = planned > 0 ? ((spent + projected) / planned) * 100 : 0;
  const state = pct >= 100 ? "over" : pct >= 80 ? "warn" : "ok";

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(planned > 0 ? String(planned).replace(".", ",") : "");

  const commit = () => {
    const parsed = parseFloat(draft.replace(",", "."));
    if (isNaN(parsed) || parsed < 0) { setEditing(false); return; }
    onSave(parsed);
    setEditing(false);
  };

  return (
    <div className="px-6 py-4">
      <div className="flex items-center gap-4">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-sm"
          style={{ backgroundColor: category.color ? category.color + "22" : "#f1f5f9" }}
        >
          {category.icon || "💳"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800">{category.name}</p>
          {budget && (
            <p className="text-xs text-slate-400 mt-0.5">
              Gasto: <span className="font-mono text-slate-600">{formatCurrency(spent)}</span>
              {projected > 0 && (
                <> {" · "}<span className="font-mono text-slate-500">+{formatCurrency(projected)}</span> previsto</>
              )}
              {" · "}
              <span className={state === "over" ? "text-expense" : state === "warn" ? "text-amber-600" : "text-slate-400"}>
                {pct.toFixed(0)}% do orçamento
              </span>
              {state === "over" && <AlertTriangle className="inline ml-1 text-expense" size={12} />}
            </p>
          )}
        </div>

        {editing ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              type="text"
              inputMode="decimal"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
              className="w-28 px-2.5 py-1.5 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="0,00"
            />
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-sm font-mono text-slate-700 hover:text-brand-600 min-w-[90px] text-right"
          >
            {planned > 0 ? formatCurrency(planned) : <span className="text-slate-400">Definir</span>}
          </button>
        )}

        {onDelete && (
          <button
            onClick={onDelete}
            className="p-1.5 text-slate-400 hover:text-expense hover:bg-expense-light rounded-lg transition"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {budget && planned > 0 && (
        <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden relative">
          {/* Projected extension: shown behind the actual bar as a lighter stripe */}
          {projected > 0 && (
            <div
              className="absolute inset-y-0 left-0 bg-slate-300/60"
              style={{ width: `${Math.min(100, projectedPct)}%` }}
              title={`Projetado: ${projectedPct.toFixed(0)}% se as recorrências previstas acontecerem`}
            />
          )}
          <div
            className={`relative h-full transition-all ${
              state === "over" ? "bg-expense" : state === "warn" ? "bg-amber-500" : "bg-income"
            }`}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
      )}
    </div>
  );
}
