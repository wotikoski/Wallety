"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useActiveGroup } from "@/lib/hooks/useActiveGroup";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import { useEffect, useId, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, TrendingDown, AlertTriangle, PiggyBank,
  ChevronRight, CheckCircle2, Eye, EyeOff, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import Link from "next/link";
import { differenceInCalendarDays, differenceInCalendarMonths, parseISO } from "date-fns";

/* ─── Types ─────────────────────────────────────────────────────────── */
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
    id: string; date: string; description: string; type: string;
    value: string; isPaid: boolean; categoryName: string | null; categoryColor: string | null;
  }[];
}

/* ─── Palette ────────────────────────────────────────────────────────── */
const A    = "#3b82f6";
const AS   = "#60a5fa";
const AD   = "#2563eb";
const AT   = "#1e3a8a";
const BS   = "#243042";
const EB   = "#334155";
const EB_L = "#cbd5d0";
const SHADES = [A, AD, AS, AT, BS, EB];

const MONTHS = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

// Responsive layout classes are defined in globals.css (.hero-card, .kpi-card, etc.)

/* ─── Chart theme ────────────────────────────────────────────────────── */
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
    grid:          isDark ? "#1a212c" : "#e6e8e3",
    axis:          isDark ? "#64748b" : "#64748b",
    tooltipBg:     isDark ? "#0d1117" : "#ffffff",
    tooltipBorder: isDark ? "#243042" : "#e6e8e3",
    tooltipText:   isDark ? "#e6e9ef" : "#0a0c10",
    tooltipMuted:  isDark ? "#64748b" : "#64748b",
    expBar:        isDark ? EB : EB_L,
  };
}

/* ── Area chart tooltip ───────────────────────────────────────────────── */
function AreaTooltip({ active, payload, label, theme }: {
  active?: boolean;
  payload?: { name: string; value: number; stroke: string }[];
  label?: string;
  theme: ReturnType<typeof useChartTheme>;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: theme.tooltipBg, border: `1px solid ${theme.tooltipBorder}`,
      borderRadius: 10, padding: "10px 14px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.18)", minWidth: 150,
    }}>
      <p style={{ color: theme.tooltipMuted, fontWeight: 700, marginBottom: 8, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.07em" }}>
        {label}
      </p>
      {payload.map((p) => (
        <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.stroke, flexShrink: 0 }} />
          <span style={{ color: theme.tooltipMuted, fontSize: 12, flex: 1 }}>{p.name}</span>
          <span style={{ color: theme.tooltipText, fontWeight: 700, fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
            {formatCurrency(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Sub-components
   ══════════════════════════════════════════════════════════════════════ */

/* ── InsightStrip ─────────────────────────────────────────────────────── */
function InsightStrip({ savingsRate, totalIncome, totalExpenses }: {
  savingsRate: number | null; totalIncome: number; totalExpenses: number;
}) {
  let msg = "Adicione receitas e despesas para ver seus insights do mês.";
  if (savingsRate !== null) {
    if (savingsRate >= 30) msg = `Excelente! Você poupou ${savingsRate}% da renda — bem acima da meta de 20%.`;
    else if (savingsRate >= 20) msg = `Ótimo ritmo! Taxa de poupança de ${savingsRate}% — meta de 20% atingida.`;
    else if (savingsRate >= 0) {
      const diff = totalIncome > 0
        ? formatCurrency(totalIncome * 0.2 - (totalIncome - totalExpenses))
        : "—";
      msg = `Poupança em ${savingsRate}%. Corte ${diff} em despesas para atingir 20%.`;
    } else {
      msg = "Despesas acima da renda esse mês. Revise os gastos para voltar ao azul.";
    }
  }
  return (
    <div style={{
      background: `linear-gradient(90deg, ${A}14, transparent)`,
      border: `1px solid ${A}33`,
      borderRadius: 12, padding: "11px 16px",
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <div style={{
        width: 26, height: 26, borderRadius: 8, flexShrink: 0,
        background: `${A}22`, color: A,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={A} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l1.5 5L19 9.5 13.5 11 12 16l-1.5-5L5 9.5 10.5 8z" />
        </svg>
      </div>
      <div style={{ fontSize: 12.5, color: "var(--color-text)", lineHeight: 1.4 }}>
        <span style={{ fontWeight: 600 }}>Insight do mês · </span>
        <span style={{ color: "var(--text-dim)" }}>{msg}</span>
      </div>
    </div>
  );
}

/* ── HeroBalance — sparkline REMOVIDA (vai para o chart principal) ────── */
function HeroBalance({ balance, monthlyTrend, hideBalance }: {
  balance: number;
  monthlyTrend: { month: string; income: number; expenses: number }[];
  hideBalance: boolean;
}) {
  let deltaLabel: string | null = null;
  let deltaPos = true;
  if (monthlyTrend.length >= 2) {
    const curr = monthlyTrend[monthlyTrend.length - 1];
    const prev = monthlyTrend[monthlyTrend.length - 2];
    const cn = curr.income - curr.expenses, pn = prev.income - prev.expenses;
    if (pn !== 0) {
      const pct = ((cn - pn) / Math.abs(pn)) * 100;
      deltaPos = pct >= 0;
      deltaLabel = `${deltaPos ? "↑" : "↓"} ${Math.abs(pct).toFixed(1).replace(".", ",")}%`;
    }
  }

  const isNeg = balance < 0;
  const whole = Math.floor(Math.abs(balance)).toLocaleString("pt-BR");
  const cents = balance.toFixed(2).split(".")[1];

  return (
    <div className="hero-card" style={{
      background: "var(--surface-card)",
      border: "1px solid var(--color-border)",
      borderRadius: 14,
      display: "flex", flexDirection: "column", justifyContent: "center",
      height: "100%",
    }}>
      {/* Label + chip */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        fontSize: 11, color: "var(--text-mute)",
        letterSpacing: 1.2, textTransform: "uppercase", fontWeight: 700,
      }}>
        Saldo total
        <span style={{
          fontSize: 9, padding: "2px 7px", borderRadius: 4,
          background: `${A}22`, color: A, fontWeight: 700, letterSpacing: 0.5,
        }}>ATUAL</span>
      </div>

      {/* Big number */}
      <div style={{ marginTop: 10, lineHeight: 1, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.035em", fontWeight: 600 }}>
        {hideBalance ? (
          <span className="hero-num" style={{ color: "var(--text-faint)" }}>R$ ••••••</span>
        ) : (
          <>
            <span className="hero-num" style={{ color: "var(--color-text)" }}>
              {isNeg ? "−" : ""}R$&nbsp;{whole}
            </span>
            <span className="hero-cents" style={{ color: "var(--text-faint)" }}>,{cents}</span>
          </>
        )}
      </div>

      {/* Delta */}
      {deltaLabel && !hideBalance && (
        <div style={{ display: "flex", gap: 14, marginTop: 14, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: deltaPos ? A : "#f87171", fontWeight: 600 }}>
            {deltaLabel}
          </span>
          <span style={{ fontSize: 12, color: "var(--text-mute)" }}>vs. mês anterior</span>
        </div>
      )}
    </div>
  );
}

/* ── KpiCard ──────────────────────────────────────────────────────────── */
function KpiCard({ label, value, hint, hintColor, hideBalance, icon }: {
  label: string; value: number; hint: string;
  hintColor?: string; hideBalance: boolean; icon: React.ReactNode;
}) {
  const fmtShort = (v: number) => {
    const abs = Math.abs(v);
    const s = v < 0 ? "-" : "";
    if (abs >= 1_000_000) return `${s}R$ ${(abs / 1e6).toFixed(1).replace(".", ",")}M`;
    if (abs >= 1_000)     return `${s}R$ ${(abs / 1e3).toFixed(1).replace(".", ",")}k`;
    return formatCurrency(v);
  };
  return (
    <div className="kpi-card" style={{
      background: "var(--surface-card)",
      border: "1px solid var(--color-border)",
      borderRadius: 14,
    }}>
      <div className="kpi-label" style={{
        color: "var(--text-mute)", letterSpacing: 1.2,
        textTransform: "uppercase", fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        {label}
        <span style={{ color: "var(--text-faint)", opacity: 0.6 }}>{icon}</span>
      </div>
      <div className="kpi-val" style={{
        fontWeight: 600, marginTop: 8,
        letterSpacing: "-0.025em", fontVariantNumeric: "tabular-nums",
        color: "var(--color-text)", lineHeight: 1.1,
      }}>
        {hideBalance ? "••••" : fmtShort(value)}
      </div>
      <div style={{ fontSize: 11, color: hintColor ?? "var(--text-mute)", marginTop: 10 }}>
        {hint}
      </div>
    </div>
  );
}

/* ── CategoryBreakdown — CSS conic-gradient ───────────────────────────── */
function CategoryBreakdown({ cats, catTotal, hideBalance }: {
  cats: { name: string; total: number }[];
  catTotal: number;
  hideBalance: boolean;
}) {
  let acc = 0;
  const stops = cats.slice(0, 6).map((c, i) => {
    const start = acc;
    acc += catTotal > 0 ? (c.total / catTotal) * 100 : 0;
    return `${SHADES[i % SHADES.length]} ${start.toFixed(2)}% ${acc.toFixed(2)}%`;
  }).join(", ");

  const fmtS = (v: number) => {
    if (v >= 1000) return `R$ ${(v / 1000).toFixed(1).replace(".", ",")}k`;
    return `R$ ${v.toFixed(0)}`;
  };

  return (
    <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
      {/* Donut */}
      <div style={{
        width: 130, height: 130, borderRadius: "50%", flexShrink: 0,
        background: cats.length > 0 ? `conic-gradient(${stops})` : "var(--surface-raised)",
        position: "relative",
      }}>
        <div style={{
          position: "absolute", inset: 18, borderRadius: "50%",
          background: "var(--surface-card)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ fontSize: 9, color: "var(--text-mute)", fontWeight: 700, letterSpacing: 1 }}>GASTO</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)", fontVariantNumeric: "tabular-nums", marginTop: 2 }}>
            {hideBalance ? "•••" : fmtS(catTotal)}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 9 }}>
        {cats.slice(0, 5).map((c, i) => {
          const pct = catTotal > 0 ? Math.round((c.total / catTotal) * 100) : 0;
          const shade = SHADES[i % SHADES.length];
          return (
            <div key={c.name}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: shade, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "var(--color-text)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                <span style={{ fontSize: 11, color: "var(--text-mute)", fontVariantNumeric: "tabular-nums", fontWeight: 600, flexShrink: 0 }}>{pct}%</span>
              </div>
              <div style={{ height: 2, background: "var(--color-border)", borderRadius: 1, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: shade, transition: "width 0.4s" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Main DashboardClient
   ══════════════════════════════════════════════════════════════════════ */
export function DashboardClient() {
  const { activeGroupId } = useActiveGroup();
  const queryClient = useQueryClient();
  const chartId = useId().replace(/:/g, "");
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [hideBalance, setHideBalance] = useState(false);
  const chartTheme = useChartTheme();

  useEffect(() => {
    try { if (localStorage.getItem("wallety_hide_balance") === "true") setHideBalance(true); } catch {}
  }, []);

  const toggleHide = () => setHideBalance((v) => {
    const next = !v;
    try { localStorage.setItem("wallety_hide_balance", String(next)); } catch {}
    return next;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const last = sessionStorage.getItem("recurring_materialized_at");
    if (last && Date.now() - parseInt(last) < 3_600_000) return;
    sessionStorage.setItem("recurring_materialized_at", String(Date.now()));
    fetch("/api/recurring/materialize", { method: "POST" })
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (res?.created > 0) {
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          queryClient.invalidateQueries({ queryKey: ["transactions"] });
        }
      }).catch(() => {});
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

  const monthStart   = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEndDate = new Date(year, month, 0);
  const monthEndStr  = `${year}-${String(month).padStart(2, "0")}-${String(monthEndDate.getDate()).padStart(2, "0")}`;
  const projParams   = new URLSearchParams({ from: monthStart, to: monthEndStr });
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

  const projected  = projData?.projected ?? [];
  const inCurrent  = (p: { date: string; effectiveDate: string | null }) => {
    const b = p.effectiveDate ?? p.date;
    return b >= monthStart && b <= monthEndStr;
  };
  const projIncome   = projected.filter((p) => p.type === "income"  && inCurrent(p)).reduce((a, p) => a + parseFloat(p.value), 0);
  const projExpenses = projected.filter((p) => p.type === "expense" && inCurrent(p)).reduce((a, p) => a + parseFloat(p.value), 0);

  if (isLoading) {
    return (
      <div className="animate-pulse dash-stack" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ height: 32, borderRadius: 8, width: 160, background: "var(--surface-raised)" }} />
          <div className="hero-grid" style={{ display: "grid", gap: 14 }}>
            {[1, 2, 3].map((i) => <div key={i} style={{ height: 160, borderRadius: 14, background: "var(--surface-raised)" }} />)}
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

  const rawCats  = data?.expensesByCategory ?? [];
  const catTotal = rawCats.reduce((s, c) => s + c.total, 0);

  const card: React.CSSProperties = {
    background: "var(--surface-card)",
    border: "1px solid var(--color-border)",
    borderRadius: 14,
  };

  const fmtShort = (v: number) => {
    const abs = Math.abs(v);
    const s = v < 0 ? "-" : "";
    if (abs >= 1_000_000) return `${s}R$ ${(abs / 1e6).toFixed(1).replace(".", ",")}M`;
    if (abs >= 1_000)     return `${s}R$ ${(abs / 1e3).toFixed(1).replace(".", ",")}k`;
    return formatCurrency(v);
  };

  return (
    <div className="dash-stack animate-fade-in" style={{ display: "flex", flexDirection: "column" }}>

        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="dash-header" style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <div>
            <h1 className="dash-title" style={{ fontWeight: 600, margin: 0, letterSpacing: "-0.03em", color: "var(--color-text)" }}>
              Dashboard
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-mute)", marginTop: 4, fontWeight: 500 }}>
              Visão geral das suas finanças
            </p>
          </div>

          {/* Controls — eye + month + year (year hidden on mobile) */}
          <div className="dash-controls" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={toggleHide}
              title={hideBalance ? "Mostrar saldo" : "Ocultar saldo"}
              style={{
                background: "transparent", border: "1px solid var(--color-border)",
                color: "var(--text-dim)", padding: 9, borderRadius: 9,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {hideBalance ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>

            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              style={{
                background: "transparent", border: "1px solid var(--color-border)",
                color: "var(--color-text)", padding: "9px 10px", borderRadius: 9,
                fontSize: 12, fontWeight: 500, cursor: "pointer",
                flex: 1, minWidth: 0,
              }}
            >
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>

            {/* Year — hidden on mobile via .year-sel class */}
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="year-sel"
              style={{
                background: "transparent", border: "1px solid var(--color-border)",
                color: "var(--color-text)", padding: "9px 10px", borderRadius: 9,
                fontSize: 12, fontWeight: 500, cursor: "pointer",
                flexShrink: 0,
              }}
            >
              {[2023, 2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* ── Overdue alert ─────────────────────────────────────────── */}
        {overdueCount > 0 && (
          <a href="/lancamentos" style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "11px 16px", borderRadius: 12,
            background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)",
            color: "#fbbf24", textDecoration: "none",
          }}>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                {overdueCount} despesa{overdueCount > 1 ? "s" : ""} em atraso
              </span>
              <span style={{ fontSize: 12, color: "#f59e0b", marginLeft: 6 }}>
                · {formatCurrency(overdueAmount)} não pago{overdueCount > 1 ? "s" : ""}
              </span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, flexShrink: 0 }}>Ver →</span>
          </a>
        )}

        {/* ── Insight strip ─────────────────────────────────────────── */}
        <InsightStrip
          savingsRate={savingsRate}
          totalIncome={totalIncome}
          totalExpenses={totalExpenses}
        />

        {/* ── Hero row: 1.6fr 1fr 1fr ───────────────────────────────── */}
        <div
          className="hero-grid"
          style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr", gap: 14 }}
        >
          <HeroBalance balance={balance} monthlyTrend={monthlyTrend} hideBalance={hideBalance} />
          <KpiCard
            label="Receitas" value={totalIncome}
            hint={projIncome > 0 ? `+ ${fmtShort(projIncome)} previsto` : "no período"}
            hintColor={A} hideBalance={hideBalance}
            icon={<TrendingUp size={14} />}
          />
          <KpiCard
            label="Despesas" value={totalExpenses}
            hint={data?.paidExpenses && totalExpenses > 0
              ? `${Math.round((data.paidExpenses / totalExpenses) * 100)}% pago`
              : "no período"}
            hideBalance={hideBalance}
            icon={<TrendingDown size={14} />}
          />
        </div>

        {/* ── Month summary strip ───────────────────────────────────── */}
        {(savingsRate !== null || isCurrentMonth) && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px,1fr))", gap: 10 }}>
            {savingsRate !== null && (
              <div style={{ ...card, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, gridColumn: "span 2" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${A}12`, color: A, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <PiggyBank size={15} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-mute)", marginBottom: 3 }}>Taxa de poupança</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: hideBalance ? "var(--text-faint)" : savingsRate >= 20 ? "#22c55e" : savingsRate >= 0 ? "#f59e0b" : "#f87171" }}>
                      {hideBalance ? "••" : `${savingsRate}%`}
                    </span>
                    {!hideBalance && <span style={{ fontSize: 11, color: "var(--text-mute)" }}>
                      {savingsRate >= 20 ? "Ótimo ritmo 🎉" : savingsRate >= 0 ? "Atenção ao orçamento" : "Gastos acima da renda"}
                    </span>}
                  </div>
                  {!hideBalance && (
                    <div style={{ marginTop: 6, height: 3, background: "var(--surface-raised)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: `${Math.min(100, Math.max(0, savingsRate))}%`, height: "100%", background: savingsRate >= 20 ? "#22c55e" : savingsRate >= 0 ? "#f59e0b" : "#f87171", transition: "width 0.5s", borderRadius: 2 }} />
                    </div>
                  )}
                </div>
              </div>
            )}
            {isCurrentMonth && (
              <div style={{ ...card, padding: "14px 18px" }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-mute)", marginBottom: 3 }}>Dias restantes</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)" }}>{daysRemaining} dias</p>
                <div style={{ marginTop: 6, height: 3, background: "var(--surface-raised)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${Math.round((daysPassed / daysInMonth) * 100)}%`, height: "100%", background: A, transition: "width 0.5s", borderRadius: 2 }} />
                </div>
              </div>
            )}
            {isCurrentMonth && daysPassed > 0 && (
              <div style={{ ...card, padding: "14px 18px" }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-mute)", marginBottom: 3 }}>Gasto médio/dia</p>
                <p style={{ fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "#f87171" }}>
                  {hideBalance ? "••••" : fmtShort(totalExpenses / daysPassed)}
                </p>
                {!hideBalance && <p style={{ fontSize: 10, color: "var(--text-mute)", marginTop: 2 }}>projeção: {fmtShort((totalExpenses / daysPassed) * daysInMonth)}</p>}
              </div>
            )}
          </div>
        )}

        {/* ── Charts row: 1.5fr 1fr ─────────────────────────────────── */}
        <div className="charts-grid" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 14 }}>
          {/* ── Area Chart: Receitas e Despesas ── */}
          <div style={{ ...card, padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>Receitas e despesas</div>
                <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 2 }}>Últimos 6 meses · em R$</div>
              </div>
              <div style={{ display: "flex", gap: 14, fontSize: 11 }}>
                {([[A, "Receita"], [chartTheme.expBar, "Despesa"]] as [string, string][]).map(([c, l]) => (
                  <span key={l} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-dim)" }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: c, display: "inline-block" }} />
                    {l}
                  </span>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthlyTrend} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id={`inc-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={A}                stopOpacity={0.25} />
                    <stop offset="95%" stopColor={A}                stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id={`exp-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={chartTheme.expBar} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={chartTheme.expBar} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={chartTheme.grid} strokeDasharray="3 0" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: chartTheme.axis, fontWeight: 600 }} axisLine={false} tickLine={false} interval={0} />
                <YAxis tick={{ fontSize: 10, fill: chartTheme.axis }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} axisLine={false} tickLine={false} width={34} />
                <Tooltip
                  cursor={{ stroke: chartTheme.grid, strokeWidth: 1 }}
                  content={(props) => (
                    <AreaTooltip
                      active={props.active}
                      payload={props.payload as { name: string; value: number; stroke: string }[]}
                      label={props.label as string}
                      theme={chartTheme}
                    />
                  )}
                />
                {/* Expense area behind income */}
                <Area
                  type="monotone" dataKey="expenses" name="Despesa"
                  stroke={chartTheme.expBar} strokeWidth={1.5}
                  fill={`url(#exp-${chartId})`}
                  dot={false} activeDot={{ r: 4, fill: chartTheme.expBar }}
                />
                <Area
                  type="monotone" dataKey="income" name="Receita"
                  stroke={A} strokeWidth={2}
                  fill={`url(#inc-${chartId})`}
                  dot={false} activeDot={{ r: 4, fill: A }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* ── Category Breakdown — conic-gradient ── */}
          <div style={{ ...card, padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>Onde foi o dinheiro</div>
                <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 2 }}>
                  {hideBalance ? "•••" : fmtShort(totalExpenses)}
                </div>
              </div>
              <Link href="/relatorios" style={{ color: A, fontSize: 11, display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
                detalhes <ChevronRight size={12} />
              </Link>
            </div>
            {rawCats.length > 0 ? (
              <CategoryBreakdown cats={rawCats} catTotal={catTotal} hideBalance={hideBalance} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: "28px 0", color: "var(--text-mute)" }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--surface-raised)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📊</div>
                <p style={{ fontSize: 13, fontWeight: 500 }}>Nenhuma despesa no período</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Goals widget ──────────────────────────────────────────── */}
        {(goalsData?.goals?.length ?? 0) > 0 && (
          <div style={{ ...card, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>Metas de Poupança</div>
              <Link href="/metas" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: A, textDecoration: "none" }}>
                Ver todas <ChevronRight size={12} />
              </Link>
            </div>
            {(goalsData?.goals ?? []).slice(0, 3).map((goal) => {
              const target   = parseFloat(goal.targetAmount);
              const saved    = parseFloat(goal.savedAmount);
              const remaining = Math.max(0, target - saved);
              const percent  = target > 0 ? Math.min(100, (saved / target) * 100) : 0;
              const done     = saved >= target;
              const today    = new Date();
              const deadline = parseISO(goal.targetDate);
              const daysLeft = differenceInCalendarDays(deadline, today);
              const mLeft    = Math.max(1, differenceInCalendarMonths(deadline, today) + 1);
              const monthly  = !done && remaining > 0 ? remaining / mLeft : 0;
              return (
                <div key={goal.id} style={{ display: "flex", alignItems: "center", padding: "14px 20px", gap: 14, borderTop: "1px solid var(--color-border)" }}>
                  <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{goal.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{goal.name}</p>
                      {done ? (
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#22c55e", display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                          <CheckCircle2 size={11} /> Concluída
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 600, color: A, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                          {hideBalance ? "••••" : monthly > 0 ? `${formatCurrency(monthly)}/mês` : "—"}
                        </span>
                      )}
                    </div>
                    <div style={{ marginTop: 6, height: 3, background: "var(--surface-raised)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: `${percent}%`, height: "100%", background: done ? "#22c55e" : `linear-gradient(90deg,${AD},${A})`, transition: "width 0.5s", borderRadius: 2 }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                      <span style={{ fontSize: 10, color: "var(--text-mute)" }}>
                        {hideBalance ? "•••" : formatCurrency(saved)} de {hideBalance ? "•••" : formatCurrency(target)}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 500, color: daysLeft < 0 ? "#f87171" : "var(--text-mute)" }}>
                        {daysLeft < 0 ? "Prazo encerrado" : daysLeft === 0 ? "Hoje!" : `${daysLeft} dias`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Últimas transações ────────────────────────────────────── */}
        <div style={{ ...card, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>Últimas transações</div>
              <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 2 }}>
                {(data?.recentTransactions ?? []).length} este período
              </div>
            </div>
            <Link href="/lancamentos" style={{
              border: "1px solid var(--color-border)", color: "var(--text-dim)",
              padding: "6px 12px", borderRadius: 8, fontSize: 11,
              display: "flex", alignItems: "center", gap: 6, textDecoration: "none",
            }}>
              Ver todas
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {(data?.recentTransactions ?? []).length === 0 ? (
            <p style={{ padding: "28px 0", textAlign: "center", color: "var(--text-mute)", fontSize: 13 }}>
              Nenhum lançamento no período
            </p>
          ) : (
            (data?.recentTransactions ?? []).map((t) => {
              const isIncome = t.type === "income";
              return (
                <div key={t.id} style={{ display: "flex", alignItems: "center", padding: "11px 0", borderTop: "1px solid var(--color-border)" }}>
                  {/* Avatar 30×30 */}
                  <div style={{
                    width: 30, height: 30, borderRadius: 8, marginRight: 12, flexShrink: 0,
                    background: isIncome ? `${A}22` : "var(--surface-raised)",
                    border: `1px solid ${isIncome ? `${A}44` : "var(--color-border)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {isIncome
                      ? <ArrowUpRight size={13} style={{ color: A }} strokeWidth={2.5} />
                      : <ArrowDownRight size={13} style={{ color: "var(--text-dim)" }} strokeWidth={2.5} />
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.description}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 1 }}>
                      {t.categoryName ?? (isIncome ? "Receita" : "—")} · {formatDate(t.date)}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: isIncome ? A : "var(--color-text)", flexShrink: 0 }}>
                    {hideBalance ? "••••" : isIncome ? `+ ${formatCurrency(t.value)}` : `− ${formatCurrency(t.value)}`}
                  </div>
                </div>
              );
            })
          )}
        </div>

    </div>
  );
}
