"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useActiveGroup } from "@/lib/hooks/useActiveGroup";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import { useEffect, useId, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight,
  AlertTriangle, PiggyBank, ChevronRight, CheckCircle2,
  Eye, EyeOff, Sparkles,
} from "lucide-react";
import Link from "next/link";
import {
  differenceInCalendarDays, differenceInCalendarMonths, parseISO,
} from "date-fns";

/* ── Types ────────────────────────────────────────────────────────────── */
interface GoalItem {
  id: string; name: string; targetAmount: string; targetDate: string;
  savedAmount: string; color: string; emoji: string;
}

interface DashboardData {
  totalIncome: number; totalExpenses: number;
  paidExpenses: number; pendingExpenses: number;
  balance: number; savingsRate: number | null;
  overdueCount: number; overdueAmount: number;
  expensesByCategory: { name: string; total: number; color: string }[];
  monthlyTrend: { month: string; income: number; expenses: number }[];
  recentTransactions: {
    id: string; date: string; description: string;
    type: string; value: string; isPaid: boolean;
    categoryName: string | null; categoryColor: string | null;
  }[];
}

/* ── Handoff palette constants ───────────────────────────────────────── */
const ACCENT   = "#3b82f6";
const ACCENT_S = "#60a5fa";  // soft
const MONO_BLUE = ["#3b82f6", "#2563eb", "#60a5fa", "#1e3a8a", "#243042", "#334155"];

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/* ── Helpers ─────────────────────────────────────────────────────────── */
function formatCurrencyShort(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}R$ ${(abs / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (abs >= 1_000)     return `${sign}R$ ${(abs / 1_000).toFixed(1).replace(".", ",")}k`;
  return formatCurrency(value);
}

/* ── Chart theme (reads dark/light from <html> class) ───────────────── */
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
    grid:          isDark ? "#1a212c" : "#e8ece9",
    axis:          isDark ? "#64748b" : "#64748b",
    tooltipBg:     isDark ? "#0d1117" : "#ffffff",
    tooltipBorder: isDark ? "#243042" : "#e6e8e3",
    tooltipText:   isDark ? "#e6e9ef" : "#0a0c10",
    tooltipMuted:  isDark ? "#64748b" : "#64748b",
    incomeBar:      ACCENT,
    expenseBar:    isDark ? "#334155" : "#cbd5d0",
  };
}

/* ══════════════════════════════════════════════════════════════════════
   Sub-components
   ══════════════════════════════════════════════════════════════════════ */

/* ── SparklineSVG ─────────────────────────────────────────────────────── */
function SparklineSVG({
  data, color, width = 180, height = 44,
}: { data: number[]; color: string; width?: number; height?: number }) {
  const id = useId().replace(/:/g, "");
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - 4 - ((v - min) / range) * (height - 8);
    return [x, y] as [number, number];
  });
  const line = pts.map((p, i) =>
    (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1)
  ).join(" ");
  const area = line + ` L ${width},${height} L 0,${height} Z`;
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} style={{ display: "block" }}>
      <defs>
        <linearGradient id={`sg-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.28" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg-${id})`} />
      <path d={line} stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="3" fill={color} />
    </svg>
  );
}

/* ── InsightStrip ─────────────────────────────────────────────────────── */
function InsightStrip({
  savingsRate, totalIncome, totalExpenses, hideBalance,
}: {
  savingsRate: number | null; totalIncome: number; totalExpenses: number; hideBalance: boolean;
}) {
  let msg = "";
  let emoji = "✨";
  if (hideBalance) {
    msg = "Saldo oculto. Clique no olho para exibir.";
    emoji = "👁";
  } else if (savingsRate === null) {
    msg = "Adicione receitas e despesas para ver seus insights do mês.";
    emoji = "💡";
  } else if (savingsRate >= 30) {
    msg = `Excelente! Você está poupando ${savingsRate}% da renda — bem acima da meta de 20%.`;
    emoji = "🏆";
  } else if (savingsRate >= 20) {
    msg = `Ótimo ritmo! Taxa de poupança de ${savingsRate}% — meta de 20% atingida.`;
    emoji = "🎉";
  } else if (savingsRate >= 0) {
    const diff = formatCurrencyShort(totalIncome * 0.2 - (totalIncome - totalExpenses));
    msg = `Poupança em ${savingsRate}%. Corte ${diff} em despesas para atingir 20%.`;
    emoji = "📊";
  } else {
    msg = "Despesas acima da renda esse mês. Revise os gastos para volcar ao azul.";
    emoji = "⚠️";
  }
  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 rounded-[10px] text-[12px] font-medium"
      style={{
        background: `linear-gradient(90deg, rgba(59,130,246,0.13) 0%, rgba(37,99,235,0.07) 100%)`,
        border: "1px solid rgba(59,130,246,0.18)",
        color: "var(--text-dim)",
      }}
    >
      <span className="text-[15px] leading-none shrink-0">{emoji}</span>
      <Sparkles size={13} style={{ color: ACCENT, flexShrink: 0 }} />
      <span style={{ color: "var(--text-dim)" }}>{msg}</span>
    </div>
  );
}

/* ── HeroBalance ──────────────────────────────────────────────────────── */
function HeroBalance({
  balance, monthlyTrend, hideBalance,
}: {
  balance: number; monthlyTrend: { month: string; income: number; expenses: number }[]; hideBalance: boolean;
}) {
  // sparkline: net (income - expenses) per month
  const sparkData = monthlyTrend.map((m) => m.income - m.expenses);

  // delta vs previous month
  let deltaLabel: string | null = null;
  let deltaPositive = true;
  if (monthlyTrend.length >= 2) {
    const curr = monthlyTrend[monthlyTrend.length - 1];
    const prev = monthlyTrend[monthlyTrend.length - 2];
    const currNet = curr.income - curr.expenses;
    const prevNet = prev.income - prev.expenses;
    if (prevNet !== 0) {
      const pct = ((currNet - prevNet) / Math.abs(prevNet)) * 100;
      deltaPositive = pct >= 0;
      deltaLabel = `${deltaPositive ? "↑" : "↓"} ${Math.abs(pct).toFixed(1).replace(".", ",")}%`;
    }
  }

  const wholeStr = Math.floor(Math.abs(balance)).toLocaleString("pt-BR");
  const centsStr = balance.toFixed(2).split(".")[1];
  const isNeg = balance < 0;

  return (
    <div
      className="relative overflow-hidden flex flex-col justify-between"
      style={{
        background: "var(--surface-card)",
        border: "1px solid var(--color-border)",
        borderRadius: 14,
        padding: "28px 30px",
        minHeight: 196,
        height: "100%",
      }}
    >
      {/* Label row */}
      <div>
        <div
          className="flex items-center gap-2"
          style={{ fontSize: 11, color: "var(--text-mute)", letterSpacing: 1.2, textTransform: "uppercase", fontWeight: 700 }}
        >
          Saldo total
          <span
            style={{
              fontSize: 9, padding: "2px 7px", borderRadius: 4,
              background: `${ACCENT}22`, color: ACCENT,
              fontWeight: 700, letterSpacing: 0.5,
            }}
          >
            ATUAL
          </span>
        </div>

        {/* Big number */}
        <div
          className="mt-2.5 leading-none"
          style={{
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.035em",
            fontWeight: 600,
            color: "var(--color-text)",
          }}
        >
          {hideBalance ? (
            <span style={{ fontSize: 48, color: "var(--text-faint)" }}>R$ ••••••</span>
          ) : (
            <>
              <span style={{ fontSize: 56 }}>
                {isNeg ? "−" : ""}R$&nbsp;{wholeStr}
              </span>
              <span style={{ fontSize: 28, color: "var(--text-faint)" }}>,{centsStr}</span>
            </>
          )}
        </div>

        {/* Delta */}
        {deltaLabel && !hideBalance && (
          <div className="flex items-center gap-2 mt-3">
            <span style={{ fontSize: 12, color: deltaPositive ? ACCENT : "#f87171", fontWeight: 600 }}>
              {deltaLabel}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-mute)" }}>vs. mês anterior</span>
          </div>
        )}
      </div>

      {/* Sparkline — bottom-right */}
      {sparkData.length >= 2 && (
        <div style={{ position: "absolute", right: 22, bottom: 16, opacity: 0.85 }}>
          <SparklineSVG data={sparkData} color={ACCENT} width={180} height={44} />
        </div>
      )}
    </div>
  );
}

/* ── KpiCard ──────────────────────────────────────────────────────────── */
function KpiCard({
  label, value, hint, hintColor, hideBalance, icon,
}: {
  label: string; value: number; hint: string;
  hintColor?: string; hideBalance: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--surface-card)",
        border: "1px solid var(--color-border)",
        borderRadius: 14,
        padding: 22,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 6,
      }}
    >
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 11, color: "var(--text-mute)", letterSpacing: 1.2, textTransform: "uppercase", fontWeight: 700 }}>
          {label}
        </span>
        <span style={{ color: "var(--text-faint)", opacity: 0.7 }}>{icon}</span>
      </div>
      <div
        style={{
          fontSize: 26, fontWeight: 600, letterSpacing: "-0.025em",
          fontVariantNumeric: "tabular-nums", color: "var(--color-text)",
          lineHeight: 1.1,
        }}
      >
        {hideBalance ? "••••" : formatCurrencyShort(value)}
      </div>
      <div style={{ fontSize: 11, color: hintColor ?? "var(--text-mute)" }}>{hint}</div>
    </div>
  );
}

/* ── Bar tooltip ──────────────────────────────────────────────────────── */
function BarTooltip({ active, payload, label, theme }: {
  active?: boolean;
  payload?: { name: string; value: number; fill: string }[];
  label?: string;
  theme: ReturnType<typeof useChartTheme>;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: theme.tooltipBg, border: `1px solid ${theme.tooltipBorder}`,
      borderRadius: 12, padding: "10px 14px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.18)", minWidth: 160,
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

/* ── Pie tooltip ──────────────────────────────────────────────────────── */
function PieTooltip({ active, payload, theme }: {
  active?: boolean;
  payload?: { name: string; value: number; payload: { fill: string } }[];
  theme: ReturnType<typeof useChartTheme>;
}) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: { fill } } = payload[0];
  return (
    <div style={{
      background: theme.tooltipBg, border: `1px solid ${theme.tooltipBorder}`,
      borderRadius: 10, padding: "8px 12px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.18)", fontSize: 12,
      display: "flex", alignItems: "center", gap: 8,
    }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: fill, flexShrink: 0 }} />
      <span style={{ color: theme.tooltipMuted }}>{name}:</span>
      <span style={{ color: theme.tooltipText, fontWeight: 700, fontFamily: "monospace" }}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Main DashboardClient
   ══════════════════════════════════════════════════════════════════════ */
export function DashboardClient() {
  const { activeGroupId } = useActiveGroup();
  const queryClient = useQueryClient();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [hideBalance, setHideBalance] = useState(false);
  const chartTheme = useChartTheme();

  // Load hideBalance from localStorage
  useEffect(() => {
    try {
      if (localStorage.getItem("wallety_hide_balance") === "true") setHideBalance(true);
    } catch {}
  }, []);

  const toggleHide = () => {
    setHideBalance((v) => {
      const next = !v;
      try { localStorage.setItem("wallety_hide_balance", String(next)); } catch {}
      return next;
    });
  };

  // Lazy-materialize recurring transactions on dashboard load
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
      .catch(() => {});
  }, [queryClient]);

  const params = new URLSearchParams({ month: String(month), year: String(year) });
  if (activeGroupId) params.set("groupId", activeGroupId);

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard", month, year, activeGroupId],
    queryFn: () => fetch(`/api/dashboard?${params}`).then((r) => {
      if (!r.ok) return r.json().then((b) => { throw new Error(b?.error ?? `API ${r.status}`); });
      return r.json();
    }),
  });

  // Projected recurring
  const monthStart  = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEndDate = new Date(year, month, 0);
  const monthEndStr = `${year}-${String(month).padStart(2, "0")}-${String(monthEndDate.getDate()).padStart(2, "0")}`;
  const projParams = new URLSearchParams({ from: monthStart, to: monthEndStr });
  if (activeGroupId) projParams.set("groupId", activeGroupId);

  const goalsParams = new URLSearchParams();
  if (activeGroupId) goalsParams.set("groupId", activeGroupId);

  const { data: goalsData } = useQuery<{ goals: GoalItem[] }>({
    queryKey: ["goals", activeGroupId],
    queryFn: () => fetch(`/api/goals?${goalsParams}`).then((r) => {
      if (!r.ok) return r.json().then((b) => { throw new Error(b?.error ?? `API ${r.status}`); });
      return r.json();
    }),
  });

  const { data: projData } = useQuery<{
    projected: { date: string; effectiveDate: string | null; type: string; value: string }[];
  }>({
    queryKey: ["recurring-projected", month, year, activeGroupId],
    queryFn: () => fetch(`/api/recurring/projected?${projParams}`).then((r) => {
      if (!r.ok) return r.json().then((b) => { throw new Error(b?.error ?? `API ${r.status}`); });
      return r.json();
    }),
  });

  const projected = projData?.projected ?? [];
  const inCurrentMonth = (p: { date: string; effectiveDate: string | null }) => {
    const bucket = p.effectiveDate ?? p.date;
    return bucket >= monthStart && bucket <= monthEndStr;
  };
  const projectedIncome   = projected.filter((p) => p.type === "income"  && inCurrentMonth(p)).reduce((a, p) => a + parseFloat(p.value), 0);
  const projectedExpenses = projected.filter((p) => p.type === "expense" && inCurrentMonth(p)).reduce((a, p) => a + parseFloat(p.value), 0);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 rounded w-48" style={{ background: "var(--surface-raised)" }} />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 rounded-xl" style={{ background: "var(--surface-raised)" }} />)}
        </div>
      </div>
    );
  }

  const totalIncome   = data?.totalIncome   ?? 0;
  const totalExpenses = data?.totalExpenses ?? 0;
  const balance       = data?.balance       ?? 0;
  const overdueCount  = data?.overdueCount  ?? 0;
  const overdueAmount = data?.overdueAmount ?? 0;
  const savingsRate   = data?.savingsRate   ?? null;
  const monthlyTrend  = data?.monthlyTrend  ?? [];

  const daysInMonth    = new Date(year, month, 0).getDate();
  const isCurrentMonth = now.getMonth() + 1 === month && now.getFullYear() === year;
  const daysPassed     = isCurrentMonth ? now.getDate() : daysInMonth;
  const daysRemaining  = isCurrentMonth ? daysInMonth - now.getDate() : 0;

  // Donut categories with monochromatic blue palette
  const cats = (data?.expensesByCategory ?? []).map((c, i) => ({
    ...c,
    fill: MONO_BLUE[i % MONO_BLUE.length],
  }));
  const catTotal = cats.reduce((s, c) => s + c.total, 0);

  return (
    <div className="space-y-3.5 animate-fade-in">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight" style={{ color: "var(--color-text)" }}>
            Dashboard
          </h1>
          <p className="text-[13px] mt-0.5 font-medium" style={{ color: "var(--text-mute)" }}>
            Visão geral das suas finanças
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Hide balance toggle */}
          <button
            onClick={toggleHide}
            title={hideBalance ? "Mostrar saldo" : "Ocultar saldo"}
            className="flex items-center justify-center w-9 h-9 rounded-[9px] transition"
            style={{
              border: "1px solid var(--color-border)",
              background: "transparent",
              color: "var(--text-dim)",
            }}
          >
            {hideBalance ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>

          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="text-[13px] font-semibold rounded-[9px] px-3 h-9 focus:outline-none focus:ring-2 focus:ring-brand-500"
            style={{ border: "1px solid var(--color-border)", background: "var(--surface-card)", color: "var(--color-text)" }}
          >
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="text-[13px] font-semibold rounded-[9px] px-3 h-9 focus:outline-none focus:ring-2 focus:ring-brand-500"
            style={{ border: "1px solid var(--color-border)", background: "var(--surface-card)", color: "var(--color-text)" }}
          >
            {[2023, 2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* ── Overdue alert ───────────────────────────────────────────── */}
      {overdueCount > 0 && (
        <a
          href="/lancamentos"
          className="flex items-center gap-3 px-4 py-3 rounded-[12px] transition group"
          style={{
            background: "rgba(251,191,36,0.08)",
            border: "1px solid rgba(251,191,36,0.25)",
            color: "#fbbf24",
          }}
        >
          <AlertTriangle size={16} className="shrink-0" style={{ color: "#fbbf24" }} />
          <div className="flex-1 min-w-0">
            <span className="text-[13px] font-semibold">
              {overdueCount} despesa{overdueCount > 1 ? "s" : ""} em atraso
            </span>
            <span className="text-[12px] ml-1.5" style={{ color: "#f59e0b" }}>
              · {formatCurrency(overdueAmount)} não pago{overdueCount > 1 ? "s" : ""}
            </span>
          </div>
          <span className="text-[11px] font-semibold shrink-0" style={{ color: "#fbbf24" }}>Ver →</span>
        </a>
      )}

      {/* ── Insight strip ───────────────────────────────────────────── */}
      <InsightStrip
        savingsRate={savingsRate}
        totalIncome={totalIncome}
        totalExpenses={totalExpenses}
        hideBalance={hideBalance}
      />

      {/* ── Hero + KPI grid ─────────────────────────────────────────── */}
      {/*
        Mobile: stacked (1 col)
        Desktop: 3-col grid — HeroBalance (col-span-2 row-span-2), KpiReceitas, KpiDespesas
      */}
      <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-3">
        {/* HeroBalance */}
        <div className="md:col-span-2 md:row-span-2">
          <HeroBalance balance={balance} monthlyTrend={monthlyTrend} hideBalance={hideBalance} />
        </div>

        {/* KPI — Receitas */}
        <KpiCard
          label="Receitas"
          value={totalIncome}
          hint={projectedIncome > 0 ? `+ ${formatCurrencyShort(projectedIncome)} previsto` : "no período"}
          hideBalance={hideBalance}
          icon={<TrendingUp size={15} />}
        />

        {/* KPI — Despesas */}
        <KpiCard
          label="Despesas"
          value={totalExpenses}
          hint={
            data?.paidExpenses && totalExpenses > 0
              ? `${Math.round((data.paidExpenses / totalExpenses) * 100)}% pago`
              : "no período"
          }
          hintColor={totalExpenses > totalIncome ? "#f87171" : undefined}
          hideBalance={hideBalance}
          icon={<TrendingDown size={15} />}
        />
      </div>

      {/* ── Month summary strip ─────────────────────────────────────── */}
      {(savingsRate !== null || isCurrentMonth) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {savingsRate !== null && (
            <div
              className="col-span-2 flex items-center gap-3 rounded-[12px] px-4 py-3"
              style={{ background: "var(--surface-card)", border: "1px solid var(--color-border)" }}
            >
              <div
                className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                style={{ background: `rgba(59,130,246,0.12)`, color: ACCENT }}
              >
                <PiggyBank size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.07em] mb-0.5" style={{ color: "var(--text-mute)" }}>
                  Taxa de poupança
                </p>
                <div className="flex items-center gap-2">
                  <span
                    className="text-[15px] font-bold tabular-nums"
                    style={{ color: hideBalance ? "var(--text-faint)" : savingsRate >= 20 ? "#22c55e" : savingsRate >= 0 ? "#f59e0b" : "#f87171" }}
                  >
                    {hideBalance ? "••" : `${savingsRate}%`}
                  </span>
                  {!hideBalance && (
                    <span className="text-[11px]" style={{ color: "var(--text-mute)" }}>
                      {savingsRate >= 20 ? "Ótimo ritmo 🎉" : savingsRate >= 0 ? "Atenção ao orçamento" : "Gastos acima da renda"}
                    </span>
                  )}
                </div>
                {!hideBalance && (
                  <div className="mt-1.5 prog-track">
                    <div
                      className="prog-fill"
                      style={{
                        width: `${Math.min(100, Math.max(0, savingsRate))}%`,
                        background: savingsRate >= 20 ? "#22c55e" : savingsRate >= 0 ? "#f59e0b" : "#f87171",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {isCurrentMonth && (
            <div
              className="flex items-center gap-3 rounded-[12px] px-4 py-3"
              style={{ background: "var(--surface-card)", border: "1px solid var(--color-border)" }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.07em] mb-0.5" style={{ color: "var(--text-mute)" }}>
                  Dias restantes
                </p>
                <p className="text-[15px] font-bold" style={{ color: "var(--color-text)" }}>
                  {daysRemaining} dias
                </p>
                <div className="mt-1.5 prog-track">
                  <div
                    className="prog-fill"
                    style={{ width: `${Math.round((daysPassed / daysInMonth) * 100)}%`, background: ACCENT }}
                  />
                </div>
              </div>
            </div>
          )}

          {isCurrentMonth && daysPassed > 0 && (
            <div
              className="flex items-center gap-3 rounded-[12px] px-4 py-3"
              style={{ background: "var(--surface-card)", border: "1px solid var(--color-border)" }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.07em] mb-0.5" style={{ color: "var(--text-mute)" }}>
                  Gasto médio/dia
                </p>
                <p className="text-[15px] font-bold tabular-nums" style={{ color: "#f87171" }}>
                  {hideBalance ? "••••" : formatCurrencyShort(totalExpenses / daysPassed)}
                </p>
                {!hideBalance && (
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--text-mute)" }}>
                    projeção: {formatCurrencyShort((totalExpenses / daysPassed) * daysInMonth)}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Charts row ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

        {/* Bar Chart: Receitas vs Despesas */}
        <div
          className="flex flex-col rounded-[14px] p-5"
          style={{ background: "var(--surface-card)", border: "1px solid var(--color-border)" }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[14px] font-bold leading-tight" style={{ color: "var(--color-text)" }}>
                Receitas vs Despesas
              </h2>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--text-mute)" }}>Últimos 6 meses</p>
            </div>
            <div className="flex items-center gap-4">
              {([
                [chartTheme.incomeBar, "Receitas"],
                [chartTheme.expenseBar, "Despesas"],
              ] as [string, string][]).map(([c, l]) => (
                <div key={l} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />
                  <span className="text-[11px] font-semibold" style={{ color: "var(--text-mute)" }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyTrend} barCategoryGap="30%" barGap={3} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={chartTheme.grid} strokeDasharray="3 0" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: chartTheme.axis, fontWeight: 600 }}
                  axisLine={false} tickLine={false} interval={0}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: chartTheme.axis }}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                  axisLine={false} tickLine={false} width={36}
                />
                <Tooltip
                  cursor={{ fill: chartTheme.isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", radius: 6 }}
                  content={(props) => (
                    <BarTooltip
                      active={props.active}
                      payload={props.payload as { name: string; value: number; fill: string }[]}
                      label={props.label as string}
                      theme={chartTheme}
                    />
                  )}
                />
                <Bar dataKey="income"   name="Receitas" fill={chartTheme.incomeBar}  radius={[5, 5, 3, 3]} maxBarSize={28} />
                <Bar dataKey="expenses" name="Despesas" fill={chartTheme.expenseBar} radius={[5, 5, 3, 3]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart: Despesas por Categoria — monochromatic blue */}
        <div
          className="flex flex-col rounded-[14px] p-5"
          style={{ background: "var(--surface-card)", border: "1px solid var(--color-border)" }}
        >
          <div className="mb-4">
            <h2 className="text-[14px] font-bold leading-tight" style={{ color: "var(--color-text)" }}>
              Despesas por Categoria
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--text-mute)" }}>Distribuição do mês</p>
          </div>

          {cats.length > 0 ? (
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Donut */}
              <div className="relative shrink-0" style={{ width: 168, height: 168 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={cats}
                      dataKey="total"
                      nameKey="name"
                      cx="50%" cy="50%"
                      innerRadius={52} outerRadius={76}
                      paddingAngle={3} strokeWidth={0}
                    >
                      {cats.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={(props) => (
                        <PieTooltip
                          active={props.active}
                          payload={props.payload as { name: string; value: number; payload: { fill: string } }[]}
                          theme={chartTheme}
                        />
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span
                    className="text-[9px] font-bold uppercase leading-tight"
                    style={{ letterSpacing: "0.09em", color: "var(--text-mute)" }}
                  >
                    Gasto
                  </span>
                  <span className="text-[13px] font-bold tabular-nums leading-tight mt-0.5" style={{ color: "var(--color-text)" }}>
                    {hideBalance ? "•••" : formatCurrencyShort(catTotal)}
                  </span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex-1 min-w-0 space-y-2">
                {cats.map((cat, i) => {
                  const pct = catTotal > 0 ? Math.round((cat.total / catTotal) * 100) : 0;
                  return (
                    <div key={cat.name}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: cat.fill }} />
                        <span
                          className="text-[11px] font-semibold truncate flex-1 min-w-0"
                          style={{ color: "var(--color-text)" }}
                        >
                          {cat.name}
                        </span>
                        <span className="text-[10px] font-bold shrink-0 tabular-nums" style={{ color: "var(--text-mute)" }}>
                          {pct}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="prog-track flex-1" style={{ height: 2 }}>
                          <div className="prog-fill" style={{ width: `${pct}%`, background: cat.fill }} />
                        </div>
                        <span className="text-[10px] font-semibold tabular-nums shrink-0" style={{ color: "var(--text-mute)" }}>
                          {hideBalance ? "•••" : formatCurrencyShort(cat.total)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div
              className="flex-1 flex flex-col items-center justify-center gap-2 py-10"
              style={{ color: "var(--text-mute)" }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                style={{ background: "var(--surface-raised)" }}
              >
                📊
              </div>
              <p className="text-sm font-medium">Nenhuma despesa no período</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Goals widget ────────────────────────────────────────────── */}
      {(goalsData?.goals?.length ?? 0) > 0 && (
        <div
          className="rounded-[14px] overflow-hidden"
          style={{ background: "var(--surface-card)", border: "1px solid var(--color-border)" }}
        >
          <div
            className="px-5 py-3.5 flex items-center justify-between"
            style={{ borderBottom: "1px solid var(--surface-divider)" }}
          >
            <h2 className="text-[14px] font-bold" style={{ color: "var(--color-text)" }}>
              Metas de Poupança
            </h2>
            <Link
              href="/metas"
              className="flex items-center gap-1 text-[12px] font-semibold transition"
              style={{ color: ACCENT }}
            >
              Ver todas <ChevronRight size={13} />
            </Link>
          </div>
          <div>
            {(goalsData?.goals ?? []).slice(0, 3).map((goal) => {
              const target   = parseFloat(goal.targetAmount);
              const saved    = parseFloat(goal.savedAmount);
              const remaining = Math.max(0, target - saved);
              const percent  = target > 0 ? Math.min(100, (saved / target) * 100) : 0;
              const done     = saved >= target;
              const today    = new Date();
              const deadline = parseISO(goal.targetDate);
              const daysLeft = differenceInCalendarDays(deadline, today);
              const monthsLeft = Math.max(1, differenceInCalendarMonths(deadline, today) + 1);
              const monthlyNeeded = !done && remaining > 0 ? remaining / monthsLeft : 0;
              return (
                <div
                  key={goal.id}
                  className="flex items-center px-5 py-3.5 gap-4"
                  style={{ borderBottom: "1px solid var(--surface-divider)" }}
                >
                  <span className="text-2xl leading-none shrink-0">{goal.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-[13px] font-semibold truncate" style={{ color: "var(--color-text)" }}>
                        {goal.name}
                      </p>
                      {done ? (
                        <span className="text-[11px] font-semibold flex items-center gap-1 shrink-0" style={{ color: "#22c55e" }}>
                          <CheckCircle2 size={11} /> Concluída
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold shrink-0 tabular-nums" style={{ color: ACCENT }}>
                          {hideBalance ? "••••" : monthlyNeeded > 0 ? `${formatCurrency(monthlyNeeded)}/mês` : "—"}
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 prog-track">
                      <div
                        className="prog-fill"
                        style={{
                          width: `${percent}%`,
                          background: done ? "#22c55e" : `linear-gradient(90deg, ${ACCENT}, ${ACCENT_S})`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px]" style={{ color: "var(--text-mute)" }}>
                        {hideBalance ? "•••" : formatCurrency(saved)} de {hideBalance ? "•••" : formatCurrency(target)}
                      </span>
                      <span
                        className="text-[10px] font-medium"
                        style={{ color: daysLeft < 0 ? "#f87171" : "var(--text-mute)" }}
                      >
                        {daysLeft < 0 ? "Prazo encerrado" : daysLeft === 0 ? "Hoje!" : `${daysLeft} dias`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Recent Transactions ─────────────────────────────────────── */}
      <div
        className="rounded-[14px] overflow-hidden"
        style={{ background: "var(--surface-card)", border: "1px solid var(--color-border)" }}
      >
        <div
          className="px-5 py-3.5 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--surface-divider)" }}
        >
          <h2 className="text-[14px] font-bold" style={{ color: "var(--color-text)" }}>
            Lançamentos Recentes
          </h2>
        </div>
        <div>
          {(data?.recentTransactions ?? []).length === 0 ? (
            <div className="p-12 text-center text-sm" style={{ color: "var(--text-mute)" }}>
              Nenhum lançamento no período
            </div>
          ) : (
            (data?.recentTransactions ?? []).map((t) => (
              <div
                key={t.id}
                className="flex items-center px-5 py-3.5 gap-3.5 cursor-pointer transition"
                style={{ borderBottom: "1px solid var(--surface-divider)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {/* Icon avatar */}
                <div
                  className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                  style={{
                    background: t.type === "income"
                      ? `rgba(59,130,246,0.12)`
                      : `rgba(100,116,139,0.12)`,
                  }}
                >
                  {t.type === "income"
                    ? <ArrowUpRight size={15} style={{ color: ACCENT }} strokeWidth={2.5} />
                    : <ArrowDownRight size={15} style={{ color: "var(--text-dim)" }} strokeWidth={2.5} />
                  }
                </div>

                {/* Description + meta */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold truncate" style={{ color: "var(--color-text)" }}>
                    {t.description}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px]" style={{ color: "var(--text-mute)" }}>{formatDate(t.date)}</span>
                    {t.categoryName && (
                      <>
                        <span style={{ color: "var(--text-faint)", fontSize: 10 }}>·</span>
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${MONO_BLUE[0]}18`,
                            color: ACCENT,
                          }}
                        >
                          {t.categoryName}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right shrink-0">
                  <p
                    className="text-[14px] font-semibold tabular-nums"
                    style={{
                      color: t.type === "income" ? ACCENT : "var(--text-dim)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {hideBalance
                      ? "••••••"
                      : `${t.type === "income" ? "+" : "−"}${formatCurrency(t.value)}`
                    }
                  </p>
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: t.isPaid ? "#22c55e" : "#f59e0b" }}
                  >
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
