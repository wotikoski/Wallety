"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActiveGroup } from "@/lib/hooks/useActiveGroup";
import { formatCurrency } from "@/lib/utils/currency";
import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
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
        body: JSON.stringify({ categoryId: d.categoryId, amount: d.amount, year, month, groupId: activeGroupId ?? undefined }),
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
  const rows = expenseCategories.map((cat) => ({ category: cat, budget: budgets.find((b) => b.categoryId === cat.id) }));

  const totalPlanned = budgets.reduce((acc, b) => acc + parseFloat(b.amount), 0);
  const totalSpent = budgets.reduce((acc, b) => acc + b.spent, 0);
  const totalProjected = budgets.reduce((acc, b) => acc + (projectedByCat.get(b.categoryId) ?? 0), 0);
  const overallPct = totalPlanned > 0 ? Math.round((totalSpent / totalPlanned) * 100) : 0;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold text-app-text tracking-tight">Orçamentos</h1>
          <p className="text-app-muted text-[13px] mt-0.5 font-medium">Defina um teto mensal de gastos por categoria</p>
        </div>
        {/* Month nav */}
        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="text-[13px] font-semibold border-[1.5px] border-app-border rounded-[10px] px-3 h-9 bg-white text-app-text focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="text-[13px] font-semibold border-[1.5px] border-app-border rounded-[10px] px-3 h-9 bg-white text-app-text focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {[2023, 2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Hero summary card */}
      <div className="bg-white rounded-[14px] border border-app-border shadow-card p-5">
        <div className="flex flex-wrap gap-6 items-center">
          <div className="flex-1 min-w-[200px]">
            <p className="text-[11px] font-bold text-app-muted uppercase tracking-[0.07em] mb-2">Gasto total do mês</p>
            <div className="flex items-baseline gap-2.5 mb-3">
              <p className="text-[26px] font-bold font-mono text-app-text">{formatCurrency(totalSpent)}</p>
              <span className="text-[13px] text-app-muted">de {formatCurrency(totalPlanned)}</span>
            </div>
            <div className="prog-track" style={{ height: 8 }}>
              <div
                className="prog-fill"
                style={{ width: `${Math.min(100, overallPct)}%`, background: overallPct >= 100 ? "#f87171" : overallPct >= 80 ? "#f59e0b" : "#10b981" }}
              />
            </div>
            <p className="text-[12px] text-app-muted mt-1.5">{overallPct}% do orçamento utilizado</p>
          </div>
          <div className="flex gap-6 items-center">
            <div className="text-center">
              <p className="text-[18px] font-bold font-mono text-income">{formatCurrency(Math.max(0, totalPlanned - totalSpent))}</p>
              <p className="text-[11px] text-app-muted mt-1">Disponível</p>
            </div>
            <div className="w-px h-10 bg-app-border" />
            <div className="text-center">
              <p className="text-[18px] font-bold font-mono text-app-text">
                {budgets.filter((b) => b.spent <= parseFloat(b.amount)).length}/{budgets.length}
              </p>
              <p className="text-[11px] text-app-muted mt-1">Dentro do limite</p>
            </div>
            {totalProjected > 0 && (
              <>
                <div className="w-px h-10 bg-app-border" />
                <div className="text-center">
                  <p className="text-[18px] font-bold font-mono text-app-text">+{formatCurrency(totalProjected)}</p>
                  <p className="text-[11px] text-app-muted mt-1">Previsto</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Budget cards grid */}
      {isLoading ? (
        <ListSkeleton rows={4} />
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-[14px] border border-app-border shadow-card p-12 text-center text-app-muted text-sm">
          Nenhuma categoria de despesa cadastrada
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rows.map(({ category, budget }) => (
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
  const barColor = state === "over" ? "#f87171" : state === "warn" ? "#f59e0b" : category.color ?? "#6366f1";

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(planned > 0 ? String(planned).replace(".", ",") : "");

  const commit = () => {
    const parsed = parseFloat(draft.replace(",", "."));
    if (isNaN(parsed) || parsed < 0) { setEditing(false); return; }
    onSave(parsed);
    setEditing(false);
  };

  return (
    <div className="bg-white rounded-[14px] border border-app-border shadow-card p-4">
      {/* Top row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ background: category.color ?? "#6366f1" }}
          />
          <span className="text-[14px] font-semibold text-app-text">{category.name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {state === "over" && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(248,113,113,.12)", color: "#f87171" }}>
              Acima do limite
            </span>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1 text-app-muted hover:text-expense hover:bg-[rgba(248,113,113,.1)] rounded-lg transition"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Value row */}
      <div className="flex items-center justify-between mb-2.5">
        {editing ? (
          <input
            autoFocus
            type="text"
            inputMode="decimal"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
            className="w-32 px-2.5 h-8 text-[13px] font-mono border-[1.5px] border-brand-400 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="0,00"
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-[18px] font-bold font-mono text-app-text hover:text-brand-500 transition"
            style={{ color: state === "over" ? "#f87171" : undefined }}
          >
            {formatCurrency(spent)}
          </button>
        )}
        <span className="text-[12px] text-app-muted">
          limite{" "}
          <button onClick={() => setEditing(true)} className="font-mono font-semibold hover:text-brand-500 transition">
            {planned > 0 ? formatCurrency(planned) : <span className="text-brand-500">Definir</span>}
          </button>
        </span>
      </div>

      {/* Progress bar */}
      {planned > 0 && (
        <>
          <div className="prog-track relative" style={{ height: 7 }}>
            {projected > 0 && (
              <div
                className="absolute inset-y-0 left-0 rounded-full opacity-30"
                style={{ width: `${Math.min(100, projectedPct)}%`, background: barColor }}
              />
            )}
            <div className="prog-fill" style={{ width: `${Math.min(100, pct)}%`, background: barColor }} />
          </div>
          <p className="text-[11px] mt-1.5 font-medium" style={{ color: state === "over" ? "#f87171" : state === "warn" ? "#f59e0b" : "#94a3b8" }}>
            {Math.round(pct)}%
            {state === "over"
              ? ` · ${formatCurrency(spent - planned)} acima`
              : ` · ${formatCurrency(planned - spent)} restante`}
            {projected > 0 && <span className="text-app-muted"> · +{formatCurrency(projected)} previsto</span>}
            {state === "over" && <AlertTriangle className="inline ml-1" size={11} />}
          </p>
        </>
      )}
    </div>
  );
}
