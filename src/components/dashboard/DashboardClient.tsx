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

/* ── Chart theme hook ─────────────────────────────────────────────────── */
// Recharts renders SVG so it can't read CSS variables directly.
// This hook watches the <html> class list and returns resolved color values.
function useChartTheme() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const el = document.documentElement;
    const sync = () => setIsDark(el.classList.contains("dark"));
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return {
    isDark,
    grid:          isDark ? "#2B284F" : "#EEEDF8",
    axis:          isDark ? "#8B88C0" : "#9490C8",
    tooltipBg:     isDark ? "#1C1845" : "#FFFFFF",
    tooltipBorder: isDark ? "#2B284F" : "#E2E0F4",
    tooltipText:   isDark ? "#E8E6FF" : "#0F0D2E",
    tooltipMuted:  isDark ? "#8B88C0" : "#706DA0",
  };
}

/* ── Custom Bar Chart Tooltip ─────────────────────────────────────────── */
function BarTooltip({ active, payload, label, theme }: {
  active?: boolean;
  payload?: { name: string; value: number; fill: string }[];
  label?: string;
  theme: ReturnType<typeof useChartTheme>;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: theme.tooltipBg,
      border: `1px solid ${theme.tooltipBorder}`,
      borderRadius: 12,
      padding: "10px 14px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
      minWidth: 160,
    }}>
      <p style={{ color: theme.tooltipMuted, fontWeight: 700, marginBottom: 8, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.07em" }}>
        {label}
      </p>
      {payload.map((p) => (
        <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.fill, flexShrink: 0 }} />
          <span style={{ color: theme.tooltipMuted, fontSize: 12, flex: 1 }}>{p.name}</span>
          <span style={{ color: theme.tooltipText, fontWeight: 700, fontSize: 12, fontFamily: "monospace" }}>
            {formatCurrency(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Custom Pie / Donut Tooltip ───────────────────────────────────────── */
function PieTooltip({ active, payload, theme }: {
  active?: boolean;
  payload?: { name: string; value: number; payload: { color: string } }[];
  theme: ReturnType<typeof useChartTheme>;
}) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: { color } } = payload[0];
  return (
    <div style={{
      background: theme.tooltipBg,
      border: `1px solid ${theme.tooltipBorder}`,
      borderRadius: 10,
      padding: "8px 12px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
      fontSize: 12,
      display: "flex",
      alignItems: "center",
      gap: 8,
    }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <span style={{ color: theme.tooltipMuted }}>{name}:</span>
      <span style={{ color: theme.tooltipText, fontWeight: 700, fontFamily: "monospace" }}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}

export function DashboardClient() {
  const { activeGroupId } = useActiveGroup();
  const queryClient = useQueryClient();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const chartTheme = useChartTheme();

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
    queryFn: () => fetch(`/api/dashboard?${params}`).then((r) => { if (!r.ok) { return r.json().then((b) => { throw new Error(b?.error ?? `API ${r.status}`); }); } return r.json(); }),
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
    queryFn: () => fetch(`/api/recurring/projected?${projParams}`).then((r) => { if (!r.ok) { return r.json().then((b) => { throw new Error(b?.error ?? `API ${r.status}`); }); } return r.json(); }),
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
        <div className="h-8 bg-[var(--surface-raised)] rounded w-48" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-[var(--surface-raised)] rounded-xl" />)}
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
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-[22px] font-extrabold text-app-text tracking-tight">Dashboard</h1>
          <p className="text-app-muted text-[13px] mt-0.5 font-medium">Visão geral das suas finanças</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="text-[13px] font-semibold border-[1.5px] border-app-border rounded-[10px] px-3 h-9 bg-white text-app-text focus:outline-none focus:ring-2 focus:ring-brand-500"
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

        {/* ── Bar Chart: Receitas vs Despesas ── */}
        <div className="bg-white rounded-[14px] border border-app-border p-5 shadow-card flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[14px] font-bold text-app-text leading-tight">Receitas vs Despesas</h2>
              <p className="text-[11px] text-app-muted mt-0.5">Últimos 6 meses</p>
            </div>
            <div className="flex items-center gap-4">
              {([["#10b981", "Receitas"], ["#f87171", "Despesas"]] as const).map(([c, l]) => (
                <div key={l} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />
                  <span className="text-[11px] text-app-muted font-semibold">{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={data?.monthlyTrend ?? []}
                barCategoryGap="30%"
                barGap={3}
                margin={{ top: 4, right: 4, left: -8, bottom: 0 }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke={chartTheme.grid}
                  strokeDasharray="3 0"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: chartTheme.axis, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: chartTheme.axis }}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip
                  cursor={{ fill: chartTheme.isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", radius: 6 }}
                  content={(props) => (
                    <BarTooltip
                      active={props.active}
                      payload={props.payload as { name: string; value: number; fill: string }[]}
                      label={props.label as string}
                      theme={chartTheme}
                    />
                  )}
                />
                <Bar dataKey="income" name="Receitas" fill="#10b981" radius={[5, 5, 3, 3]} maxBarSize={28} />
                <Bar dataKey="expenses" name="Despesas" fill="#f87171" radius={[5, 5, 3, 3]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Donut Chart: Despesas por Categoria ── */}
        <div className="bg-white rounded-[14px] border border-app-border p-5 shadow-card flex flex-col">
          <div className="mb-4">
            <h2 className="text-[14px] font-bold text-app-text leading-tight">Despesas por Categoria</h2>
            <p className="text-[11px] text-app-muted mt-0.5">Distribuição do mês</p>
          </div>

          {(data?.expensesByCategory?.length ?? 0) > 0 ? (() => {
            const cats = data!.expensesByCategory;
            const catTotal = cats.reduce((s, c) => s + c.total, 0);
            return (
              <div className="flex items-center gap-4 sm:gap-6">
                {/* Donut */}
                <div className="relative shrink-0" style={{ width: 168, height: 168 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={cats}
                        dataKey="total"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={76}
                        paddingAngle={3}
                        strokeWidth={0}
                      >
                        {cats.map((entry, i) => (
                          <Cell key={i} fill={entry.color || `hsl(${i * 47}, 68%, 52%)`} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={(props) => (
                          <PieTooltip
                            active={props.active}
                            payload={props.payload as { name: string; value: number; payload: { color: string } }[]}
                            theme={chartTheme}
                          />
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[9px] font-bold text-app-muted uppercase tracking-[0.09em] leading-tight">Total</span>
                    <span className="text-[13px] font-bold font-mono text-app-text leading-tight mt-0.5">
                      {formatCurrencyShort(catTotal)}
                    </span>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex-1 min-w-0 space-y-2">
                  {cats.map((cat) => {
                    const pct = catTotal > 0 ? Math.round((cat.total / catTotal) * 100) : 0;
                    return (
                      <div key={cat.name}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: cat.color }} />
                          <span className="text-[11px] font-semibold text-app-text truncate flex-1 min-w-0">{cat.name}</span>
                          <span className="text-[10px] font-bold text-app-muted shrink-0 tabular-nums">{pct}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="prog-track flex-1" style={{ height: 3 }}>
                            <div className="prog-fill" style={{ width: `${pct}%`, background: cat.color }} />
                          </div>
                          <span className="text-[10px] font-semibold text-app-muted font-mono tabular-nums shrink-0">
                            {formatCurrencyShort(cat.total)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })() : (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-app-muted py-10">
              <div className="w-12 h-12 rounded-full bg-[var(--surface-raised)] flex items-center justify-center text-xl">📊</div>
              <p className="text-sm font-medium">Nenhuma despesa no período</p>
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

      {/* Mobile: abbreviated value + tap-to-reveal tooltip */}
      <div className="relative md:hidden">
        <button
          onClick={() => setTooltip((v) => !v)}
          className={`text-[14px] font-bold font-mono tracking-tight leading-none text-left ${color === "income" ? "text-income" : "text-expense"}`}
        >
          {formatCurrencyShort(value)}
        </button>
        {tooltip && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#0f172a] text-white text-[12px] font-mono font-semibold px-3 py-1.5 rounded-[8px] whitespace-nowrap shadow-lg z-30 pointer-events-none animate-fade-in">
            {formatCurrency(value)}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-[#0f172a]" />
          </div>
        )}
      </div>
      {/* Desktop: full value, no interaction */}
      <p className={`hidden md:block text-[24px] font-bold font-mono tracking-tight leading-none ${color === "income" ? "text-income" : "text-expense"}`}>
        {formatCurrency(value)}
      </p>

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
