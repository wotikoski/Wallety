"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useActiveGroup } from "@/lib/hooks/useActiveGroup";
import { formatCurrency } from "@/lib/utils/currency";
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
    <div className="space-y-6 animate-fade-in">
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
            className="flex-1 sm:flex-none text-[13px] font-semibold border-[1.5px] border-app-border rounded-[10px] px-3 py-[7px] bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="text-[13px] font-semibold border-[1.5px] border-app-border rounded-[10px] px-3 py-[7px] bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {[2023, 2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <SummaryCard
          label="Receitas"
          value={totalIncome}
          icon={<TrendingUp size={20} />}
          color="income"
          projected={projectedIncome}
        />
        <SummaryCard
          label="Despesas"
          value={totalExpenses}
          icon={<TrendingDown size={20} />}
          color="expense"
          paid={data?.paidExpenses ?? 0}
          pending={data?.pendingExpenses ?? 0}
          projected={projectedExpenses}
        />
        <SummaryCard
          label="Saldo"
          value={balance}
          icon={<Wallet size={20} />}
          color={balance >= 0 ? "income" : "expense"}
          projectedBalance={
            projectedIncome || projectedExpenses
              ? balance + projectedIncome - projectedExpenses
              : undefined
          }
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {/* Monthly Trend */}
        <div className="bg-white rounded-2xl border border-app-border p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-bold text-app-text">Receitas vs Despesas</h2>
            <div className="flex items-center gap-3">
              {[["#0d9f6a", "Receitas"], ["#e05252", "Despesas"]].map(([c, l]) => (
                <div key={l} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-[3px]" style={{ background: c }} />
                  <span className="text-[11px] text-app-muted font-medium">{l}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data?.monthlyTrend ?? []} barCategoryGap="30%">
              <CartesianGrid vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ba3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ba3af" }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: "#fff", border: "1px solid #e8eaf2", borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="income" name="Receitas" fill="#0d9f6a" radius={[6, 6, 6, 6]} />
              <Bar dataKey="expenses" name="Despesas" fill="#e05252" radius={[6, 6, 6, 6]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Expenses by Category */}
        <div className="bg-white rounded-2xl border border-app-border p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <h2 className="text-[14px] font-bold text-app-text mb-4">Despesas por Categoria</h2>
          {(data?.expensesByCategory?.length ?? 0) > 0 ? (
            <div className="flex items-center gap-4">
              <div className="w-[150px] h-[150px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data?.expensesByCategory ?? []} dataKey="total" nameKey="name" cx="50%" cy="50%" innerRadius={46} outerRadius={68} paddingAngle={2}>
                      {(data?.expensesByCategory ?? []).map((entry, index) => (
                        <Cell key={index} fill={entry.color || `hsl(${index * 37}, 70%, 50%)`} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: "#fff", border: "1px solid #e8eaf2", borderRadius: 10, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                {(data?.expensesByCategory ?? []).map((cat) => (
                  <div key={cat.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: cat.color }} />
                    <span className="text-[11px] text-slate-500 font-medium flex-1 truncate">{cat.name}</span>
                    <span className="text-[11px] font-bold text-slate-700 tabular-nums">{formatCurrency(cat.total)}</span>
                  </div>
                ))}
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
      <div className="bg-white rounded-2xl border border-app-border shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
          <h2 className="text-[14px] font-bold text-app-text">Lançamentos Recentes</h2>
        </div>
        <div className="divide-y divide-[#f7f8fc]">
          {(data?.recentTransactions ?? []).length === 0 ? (
            <div className="p-12 text-center text-app-muted text-sm">
              Nenhum lançamento no período
            </div>
          ) : (
            (data?.recentTransactions ?? []).map((t) => (
              <div key={t.id} className="flex items-center px-5 py-3 gap-3 hover:bg-[#f9fafc] transition cursor-pointer">
                <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 ${t.type === "income" ? "bg-income-light" : "bg-expense-light"}`}>
                  {t.type === "income"
                    ? <ArrowUpRight size={16} className="text-income" strokeWidth={2.5} />
                    : <ArrowDownRight size={16} className="text-expense" strokeWidth={2.5} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-app-text truncate">{t.description}</p>
                  <p className="text-[11px] text-app-muted mt-0.5">{formatDate(t.date)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-[14px] font-bold tabular-nums ${t.type === "income" ? "text-income" : "text-expense"}`}>
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
  const showProgress = paid !== undefined && pending !== undefined && value > 0;
  const pct = showProgress ? Math.min(100, Math.round((paid! / value) * 100)) : 0;

  return (
    <div className="bg-white rounded-2xl border border-app-border p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.03)] flex-1 min-w-0">
      <div className="flex items-start justify-between mb-3.5">
        <span className="text-[11px] font-bold text-app-muted uppercase tracking-[0.06em]">{label}</span>
        <div className={`w-[34px] h-[34px] rounded-[10px] flex items-center justify-center shrink-0 ${color === "income" ? "bg-income-light text-income" : "bg-expense-light text-expense"}`}>
          {icon}
        </div>
      </div>
      <p className={`text-[26px] font-extrabold tracking-tight leading-none ${color === "income" ? "text-income" : "text-expense"}`}>
        {formatCurrency(value)}
      </p>
      {showProgress && (
        <div className="mt-3">
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-expense transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1.5 font-medium">
            {pct}% pago
            {pending! > 0 && (
              <span className="text-slate-400"> · {formatCurrency(pending!)} pendente</span>
            )}
          </p>
        </div>
      )}
      {projected !== undefined && projected > 0 && (
        <p className="text-xs text-slate-400 mt-2 border-t border-dashed border-slate-200 pt-2">
          <span className="font-medium text-slate-500">+ {formatCurrency(projected)}</span> previsto
        </p>
      )}
      {projectedBalance !== undefined && (
        <p className="text-xs text-slate-400 mt-2 border-t border-dashed border-slate-200 pt-2">
          Previsto fim do mês:{" "}
          <span className={`font-mono font-medium ${projectedBalance >= 0 ? "text-income" : "text-expense"}`}>
            {formatCurrency(projectedBalance)}
          </span>
        </p>
      )}
    </div>
  );
}
