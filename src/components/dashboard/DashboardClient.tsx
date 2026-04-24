"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useActiveGroup } from "@/lib/hooks/useActiveGroup";
import { formatCurrency } from "@/lib/utils/currency";

function formatCurrencyShort(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}R$ ${(abs / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (abs >= 1_000) return `${sign}R$ ${(abs / 1_000).toFixed(1).replace(".", ",")}k`;
  return formatCurrency(value);
}
import { formatDate } from "@/lib/utils/date";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface DashboardData {
  totalIncome: number;
  totalExpenses: number;
  paidExpenses: number;
  pendingExpenses: number;
  balance: number;
  expensesByCategory: { name: string; total: number; color: string }[];
  monthlyTrend: { month: string; income: number; expenses: number }[];
  recentTransactions: {
    id: string;
    date: string;
    description: string;
    type: string;
    value: string;
    isPaid: boolean;
    categoryName: string | null;
    categoryColor: string | null;
  }[];
}

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function DashboardClient() {
  const { activeGroupId } = useActiveGroup();
  const queryClient = useQueryClient();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  // Lazy-materialize recurring transactions on dashboard load.
  // Fire-and-forget: if anything new is created, refresh dashboard + lançamentos.
  // Throttled to once per session via sessionStorage to avoid thrashing.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = "recurring_materialized_at";
    const last = sessionStorage.getItem(key);
    const ONE_HOUR = 60 * 60 * 1000;
    if (last && Date.now() - parseInt(last) < ONE_HOUR) return;
    sessionStorage.setItem(key, String(Date.now()));

    fetch("/api/recurring/materialize", { method: "POST" })
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (res && res.created > 0) {
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          queryClient.invalidateQueries({ queryKey: ["transactions"] });
        }
      })
      .catch(() => { /* silent: best-effort */ });
  }, [queryClient]);

  const params = new URLSearchParams({ month: String(month), year: String(year) });
  if (activeGroupId) params.set("groupId", activeGroupId);

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard", month, year, activeGroupId],
    queryFn: () => fetch(`/api/dashboard?${params}`).then((r) => r.json()),
  });

  // Projected (not-yet-materialized) recurring occurrences for the visible
  // month — shown separately so they never inflate "realized" totals.
  const projParams = new URLSearchParams();
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEnd = new Date(year, month, 0);
  const monthEndStr = `${year}-${String(month).padStart(2, "0")}-${String(monthEnd.getDate()).padStart(2, "0")}`;
  projParams.set("from", monthStart);
  projParams.set("to", monthEndStr);
  if (activeGroupId) projParams.set("groupId", activeGroupId);

  const { data: projData } = useQuery<{ projected: { date: string; effectiveDate: string | null; type: string; value: string }[] }>({
    queryKey: ["recurring-projected", month, year, activeGroupId],
    queryFn: () => fetch(`/api/recurring/projected?${projParams}`).then((r) => r.json()),
  });

  const projected = projData?.projected ?? [];
  // Bucket by invoice month when present — an April credit-card recurrence
  // with effective_date in May belongs to May's projected totals.
  const inCurrentMonth = (p: { date: string; effectiveDate: string | null }) => {
    const bucket = p.effectiveDate ?? p.date;
    return bucket >= monthStart && bucket <= monthEndStr;
  };
  const projectedIncome = projected
    .filter((p) => p.type === "income" && inCurrentMonth(p))
    .reduce((acc, p) => acc + parseFloat(p.value), 0);
  const projectedExpenses = projected
    .filter((p) => p.type === "expense" && inCurrentMonth(p))
    .reduce((acc, p) => acc + parseFloat(p.value), 0);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 rounded w-48" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-slate-200 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const totalIncome = data?.totalIncome ?? 0;
  const totalExpenses = data?.totalExpenses ?? 0;
  const balance = data?.balance ?? 0;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold text-app-text tracking-tight">Dashboard</h1>
          <p className="text-app-muted text-[13px] mt-0.5 font-medium">Visão geral das suas finanças</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="flex-1 sm:flex-none text-[13px] font-semibold border-[1.5px] border-app-border rounded-[10px] px-3 h-9 bg-white text-app-text focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="text-[13px] font-semibold border-[1.5px] border-app-border rounded-[10px] px-3 h-9 bg-white text-app-text focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {[2023, 2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        <SummaryCard
          label="Receitas"
          value={totalIncome}
          icon={<TrendingUp size={18} />}
          color="income"
          projected={projectedIncome}
        />
        <SummaryCard
          label="Despesas"
          value={totalExpenses}
          icon={<TrendingDown size={18} />}
          color="expense"
          paid={data?.paidExpenses ?? 0}
          pending={data?.pendingExpenses ?? 0}
          projected={projectedExpenses}
        />
        <SummaryCard
          label="Saldo"
          value={balance}
          icon={<Wallet size={18} />}
          color={balance >= 0 ? "income" : "expense"}
          projectedBalance={
            projectedIncome || projectedExpenses
              ? balance + projectedIncome - projectedExpenses
              : undefined
          }
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Monthly Trend */}
        <div className="bg-white rounded-[14px] border border-app-border p-4 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-bold text-app-text">Receitas vs Despesas</h2>
            <div className="flex items-center gap-3">
              {[["#10b981", "Receitas"], ["#f87171", "Despesas"]].map(([c, l]) => (
                <div key={l} className="flex items-center gap-1.5">
                  <div className="w-5 h-[2.5px] rounded-full" style={{ background: c }} />
                  <span className="text-[11px] text-app-muted font-medium">{l}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data?.monthlyTrend ?? []} barCategoryGap="35%">
              <CartesianGrid vertical={false} stroke="#f1f3f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} interval={0} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v: number) => formatCurrency(v)}
                contentStyle={{ background: "#fff", border: "1px solid #e2e5ef", borderRadius: 10, fontSize: 12, boxShadow: "0 4px 16px rgba(0,0,0,.08)" }}
              />
              <Bar dataKey="income" name="Receitas" fill="#10b981" radius={[5, 5, 5, 5]} />
              <Bar dataKey="expenses" name="Despesas" fill="#f87171" radius={[5, 5, 5, 5]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Expenses by Category */}
        <div className="bg-white rounded-[14px] border border-app-border p-4 shadow-card">
          <h2 className="text-[14px] font-bold text-app-text mb-4">Despesas por Categoria</h2>
          {(data?.expensesByCategory?.length ?? 0) > 0 ? (
            <div className="flex items-start gap-5">
              <div className="w-[140px] h-[140px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data?.expensesByCategory ?? []} dataKey="total" nameKey="name" cx="50%" cy="50%" innerRadius={44} outerRadius={66} paddingAngle={2}>
                      {(data?.expensesByCategory ?? []).map((entry, index) => (
                        <Cell key={index} fill={entry.color || `hsl(${index * 37}, 70%, 50%)`} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => formatCurrency(v)}
                      contentStyle={{ background: "#fff", border: "1px solid #e2e5ef", borderRadius: 10, fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 min-w-0 space-y-2.5">
                {(data?.expensesByCategory ?? []).map((cat) => {
                  const total = (data?.expensesByCategory ?? []).reduce((s, c) => s + c.total, 0);
                  const pct = total > 0 ? Math.round((cat.total / total) * 100) : 0;
                  return (
                    <div key={cat.name}>
                      {/* Line 1: bullet + name + pct */}
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: cat.color }} />
                        <span className="text-[12px] font-semibold text-app-text truncate flex-1 min-w-0">{cat.name}</span>
                        <span className="text-[11px] text-app-muted shrink-0">{pct}%</span>
                      </div>
                      {/* Line 2: progress bar + value */}
                      <div className="flex items-center gap-2">
                        <div className="prog-track flex-1" style={{ height: 4 }}>
                          <div className="prog-fill" style={{ width: `${pct}%`, background: cat.color }} />
                        </div>
                        <span className="text-[11px] font-semibold text-app-muted font-mono tabular-nums shrink-0">{formatCurrency(cat.total)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-52 text-app-muted text-sm">
              Nenhuma despesa no período
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-[14px] border border-app-border shadow-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#f1f3f9] flex items-center justify-between">
          <h2 className="text-[14px] font-bold text-app-text">Lançamentos Recentes</h2>
        </div>
        <div className="divide-y divide-[#f1f3f9]">
          {(data?.recentTransactions ?? []).length === 0 ? (
            <div className="p-12 text-center text-app-muted text-sm">
              Nenhum lançamento no período
            </div>
          ) : (
            (data?.recentTransactions ?? []).map((t) => (
              <div key={t.id} className="flex items-center px-5 py-3.5 gap-3.5 hover:bg-[#f8f9fd] transition cursor-pointer">
                <div
                  className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
                  style={{ background: t.type === "income" ? "rgba(16,185,129,.12)" : "rgba(248,113,113,.12)" }}
                >
                  {t.type === "income"
                    ? <ArrowUpRight size={16} className="text-income" strokeWidth={2.5} />
                    : <ArrowDownRight size={16} className="text-expense" strokeWidth={2.5} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-app-text truncate">{t.description}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] text-app-muted">{formatDate(t.date)}</span>
                    {t.categoryName && (
                      <>
                        <span className="text-app-muted/40 text-[10px]">·</span>
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{
                            backgroundColor: t.categoryColor ? `${t.categoryColor}20` : "#6366f120",
                            color: t.categoryColor ?? "#6366f1",
                          }}
                        >
                          {t.categoryName}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-[14px] font-semibold font-mono tabular-nums ${t.type === "income" ? "text-income" : "text-expense"}`}>
                    {t.type === "income" ? "+" : "−"}{formatCurrency(t.value)}
                  </p>
                  <span className={`text-[10px] font-semibold ${t.isPaid ? "text-income" : "text-amber-500"}`}>
                    {t.isPaid ? "✓ Pago" : "● Pendente"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  color,
  paid,
  pending,
  projected,
  projectedBalance,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: "income" | "expense";
  paid?: number;
  pending?: number;
  projected?: number;
  projectedBalance?: number;
}) {
  const [tooltip, setTooltip] = useState(false);
  useEffect(() => {
    if (!tooltip) return;
    const t = setTimeout(() => setTooltip(false), 2500);
    return () => clearTimeout(t);
  }, [tooltip]);

  const showProgress = paid !== undefined && pending !== undefined && value > 0;
  const pct = showProgress ? Math.min(100, Math.round((paid! / value) * 100)) : 0;

  const iconBg = color === "income" ? "rgba(16,185,129,.12)" : color === "expense" ? "rgba(248,113,113,.12)" : "rgba(99,102,241,.12)";
  const iconColor = color === "income" ? "#10b981" : color === "expense" ? "#f87171" : "#6366f1";
  const barColor = color === "income" ? "#10b981" : "#f87171";

  return (
    <div className="bg-white rounded-[14px] border border-app-border p-3 md:p-4 shadow-card flex-1 min-w-0">
      {/* Header: label + icon badge */}
      <div className="flex items-start justify-between mb-2 md:mb-3">
        <span className="text-[9px] md:text-[11px] font-bold text-app-muted uppercase tracking-[0.07em]">{label}</span>
        <div
          className="hidden md:flex w-9 h-9 rounded-[10px] items-center justify-center shrink-0"
          style={{ background: iconBg, color: iconColor }}
        >
          {icon}
        </div>
      </div>

      {/* Value — abbreviated on mobile, full on desktop; tap for full value tooltip */}
      <div className="relative">
        <button
          onClick={() => setTooltip((v) => !v)}
          className={`font-bold font-mono tracking-tight leading-none text-left ${color === "income" ? "text-income" : "text-expense"}`}
        >
          <span className="text-[14px] md:hidden">{formatCurrencyShort(value)}</span>
          <span className="hidden md:inline text-[24px]">{formatCurrency(value)}</span>
        </button>
        {tooltip && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#0f172a] text-white text-[12px] font-mono font-semibold px-3 py-1.5 rounded-[8px] whitespace-nowrap shadow-lg z-30 pointer-events-none animate-fade-in">
            {formatCurrency(value)}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-[#0f172a]" />
          </div>
        )}
      </div>

      {/* Progress bar — desktop only */}
      {showProgress && (
        <div className="hidden md:block mt-3">
          <div className="prog-track">
            <div className="prog-fill" style={{ width: `${pct}%`, background: barColor }} />
          </div>
          <p className="text-[11px] text-app-muted mt-1.5 font-medium">
            {pct}% pago
            {pending! > 0 && <span> · {formatCurrency(pending!)} pendente</span>}
          </p>
        </div>
      )}

      {/* Projections — desktop only */}
      {projected !== undefined && projected > 0 && (
        <p className="hidden md:block text-[11px] text-app-muted mt-2 border-t border-dashed border-[#e2e5ef] pt-2">
          <span className="font-medium text-slate-500">+ {formatCurrency(projected)}</span> previsto
        </p>
      )}
      {projectedBalance !== undefined && (
        <p className="hidden md:block text-[11px] text-app-muted mt-2 border-t border-dashed border-[#e2e5ef] pt-2">
          Previsto:{" "}
          <span className={`font-mono font-semibold ${projectedBalance >= 0 ? "text-income" : "text-expense"}`}>
            {formatCurrency(projectedBalance)}
          </span>
        </p>
      )}
    </div>
  );
}
