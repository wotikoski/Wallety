"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useActiveGroup } from "@/lib/hooks/useActiveGroup";
import { useState, useRef, useEffect } from "react";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import { TrendingUp, TrendingDown, CheckCircle2, Circle, ChevronLeft, ChevronRight, ChevronDown, Repeat2, Shuffle, Layers } from "lucide-react";
import { ReportFilterSheet } from "./ReportFilterSheet";
import { format, startOfMonth, endOfMonth, addMonths, parseISO } from "date-fns";

interface ReportItem {
  label: string;
  total: number;
  count: number;
  percentage: number;
  groupKey: string;
}

interface ReportData {
  items: ReportItem[];
  grandTotal: number;
  groupBy: string;
  fixedTotal?: number;
  variableTotal?: number;
}

interface DrillTransaction {
  id: string;
  date: string;
  effectiveDate: string | null;
  description: string;
  value: string;
  isPaid: boolean;
  notes: string | null;
}

interface Drilldown {
  label: string;
  groupKey: string;
  color: string;
}

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#0ea5e9", "#f87171", "#06b6d4", "#84cc16", "#64748b"];

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export function ReportsClient() {
  const { activeGroupId } = useActiveGroup();
  const queryClient = useQueryClient();
  const now = new Date();

  const [startDate, setStartDate] = useState(format(startOfMonth(now), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(now), "yyyy-MM-dd"));
  const [groupBy, setGroupBy] = useState<"category" | "bank" | "paymentMethod" | "user">("category");
  const [reportType, setReportType] = useState<"income" | "expense">("expense");
  const [drilldown, setDrilldown] = useState<Drilldown | null>(null);
  const [costTypeFilter, setCostTypeFilter] = useState<"all" | "fixed" | "variable">("all");

  // Reset cost-type filter when switching to income mode (filter is expense-only).
  useEffect(() => {
    if (reportType === "income") setCostTypeFilter("all");
  }, [reportType]);

  // Materialize pending recurring transactions on load (same throttle as Dashboard).
  // Without this, recurring rules created after the last Dashboard visit would
  // be invisible in the report — they exist as rules but not yet as transactions.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = "recurring_materialized_at";
    const last = sessionStorage.getItem(key);
    const ONE_HOUR = 60 * 60 * 1000;
    if (last && Date.now() - parseInt(last) < ONE_HOUR) return;
    sessionStorage.setItem(key, String(Date.now()));
    fetch("/api/recurring/materialize", { method: "POST" })
      .then((r) => (r.ok ? r.json() : null))
      .then(() => {
        // Always invalidate so the report re-fetches after materialization,
        // regardless of how many transactions were created. This closes the
        // race condition where the report query fires before materialize finishes.
        queryClient.invalidateQueries({ queryKey: ["report"] });
      })
      .catch(() => {});
  }, [queryClient]);

  const params = new URLSearchParams({ startDate, endDate, groupBy });
  if (activeGroupId) params.set("groupId", activeGroupId);
  if (reportType === "expense" && costTypeFilter !== "all") params.set("costType", costTypeFilter);

  const { data, isLoading } = useQuery<ReportData>({
    queryKey: ["report", reportType, startDate, endDate, groupBy, activeGroupId, costTypeFilter],
    queryFn: () =>
      fetch(`/api/reports/${reportType === "income" ? "income" : "expenses"}?${params}`).then((r) => { if (!r.ok) { return r.json().then((b) => { throw new Error(b?.error ?? `API ${r.status}`); }); } return r.json(); }),
  });

  // Drill-down: fetch individual transactions for the selected group,
  // using effectiveDate range to match the report's bucketing logic.

  const drillParams = new URLSearchParams({
    effectiveStartDate: startDate,
    effectiveEndDate: endDate,
    type: reportType,
    limit: "500",
  });
  if (drilldown) {
    if (groupBy === "category") drillParams.set("categoryId", drilldown.groupKey);
    else if (groupBy === "bank") drillParams.set("bankId", drilldown.groupKey);
    else if (groupBy === "paymentMethod") drillParams.set("paymentMethodId", drilldown.groupKey);
  }
  if (activeGroupId) drillParams.set("groupId", activeGroupId);

  const { data: drillData, isLoading: drillLoading } = useQuery<{ transactions: DrillTransaction[] }>({
    queryKey: ["report-drilldown", drilldown?.groupKey, reportType, startDate, endDate, groupBy, activeGroupId],
    queryFn: () => fetch(`/api/transactions?${drillParams}`).then((r) => { if (!r.ok) { return r.json().then((b) => { throw new Error(b?.error ?? `API ${r.status}`); }); } return r.json(); }),
    enabled: !!drilldown,
  });

  const items = data?.items ?? [];
  const drillTxns = drillData?.transactions ?? [];

  function openDrilldown(item: ReportItem, index: number) {
    setDrilldown({ label: item.label, groupKey: item.groupKey, color: COLORS[index % COLORS.length] });
  }

  function closeDrilldown() {
    setDrilldown(null);
  }

  const drilldownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!drilldown || !drilldownRef.current) return;
    const el = drilldownRef.current;
    const timer = setTimeout(() => {
      const scrollParent = el.closest<HTMLElement>(".overflow-y-auto") ?? document.documentElement;
      const top = el.getBoundingClientRect().top + scrollParent.scrollTop - 120;
      scrollParent.scrollTo({ top, behavior: "smooth" });
    }, 150);
    return () => clearTimeout(timer);
  }, [drilldown?.groupKey]);

  // Reset drilldown when filters change
  function handleFilterChange(fn: () => void) {
    closeDrilldown();
    setCostTypeFilter("all");
    fn();
  }

  // Month navigation: move one month back/forward, correctly clamping end-of-month.
  function navigateMonth(delta: -1 | 1) {
    const ref = startDate ? parseISO(startDate) : now;
    const next = addMonths(ref, delta);
    handleFilterChange(() => {
      setStartDate(format(startOfMonth(next), "yyyy-MM-dd"));
      setEndDate(format(endOfMonth(next), "yyyy-MM-dd"));
    });
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="no-print flex items-start justify-between gap-2">
        <div>
          <h1 className="text-[22px] font-extrabold text-app-text tracking-tight">Relatórios</h1>
          <p className="text-app-muted text-[13px] mt-0.5 font-medium">Análise do histórico financeiro</p>
        </div>
        <ReportFilterSheet
          reportType={reportType}
          setReportType={setReportType}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          groupBy={groupBy}
          setGroupBy={setGroupBy}
          navigateMonth={navigateMonth}
          activeGroupId={activeGroupId ?? null}
          onFilterChange={handleFilterChange}
        />
      </div>

      {/* Filters — desktop only */}
      <div className="hidden md:flex flex-wrap gap-2 items-center no-print">
        {/* Type chips */}
        <button
          onClick={() => handleFilterChange(() => setReportType("income"))}
          className={`chip-filter${reportType === "income" ? " active" : ""}`}
        >
          <TrendingUp size={12} className="inline mr-1" />Receitas
        </button>
        <button
          onClick={() => handleFilterChange(() => setReportType("expense"))}
          className={`chip-filter${reportType === "expense" ? " active" : ""}`}
        >
          <TrendingDown size={12} className="inline mr-1" />Despesas
        </button>
        <div className="w-px h-5 bg-app-border mx-1" />
        {/* Date range */}
        <input
          type="date"
          value={startDate}
          onChange={(e) => handleFilterChange(() => setStartDate(e.target.value))}
          className="h-9 text-[13px] border-[1.5px] border-app-border rounded-[10px] px-3 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white font-medium text-app-text"
        />
        <span className="text-app-muted text-sm">→</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => handleFilterChange(() => setEndDate(e.target.value))}
          className="h-9 text-[13px] border-[1.5px] border-app-border rounded-[10px] px-3 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white font-medium text-app-text"
        />
        {/* Group by */}
        <select
          value={groupBy}
          onChange={(e) => handleFilterChange(() => setGroupBy(e.target.value as "category" | "bank" | "user"))}
          className="h-9 text-[13px] font-semibold border-[1.5px] border-app-border rounded-[10px] px-3 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-app-text"
        >
          <option value="category">Por Categoria</option>
          <option value="paymentMethod">Por Forma de Pagamento</option>
          <option value="bank">Por Banco</option>
          {activeGroupId && <option value="user">Por Usuário</option>}
        </select>
        {/* Month nav */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigateMonth(-1)}
            className="h-9 w-9 flex items-center justify-center rounded-[10px] border-[1.5px] border-app-border text-app-muted hover:bg-[var(--surface-raised)] hover:text-app-text transition"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => navigateMonth(1)}
            className="h-9 w-9 flex items-center justify-center rounded-[10px] border-[1.5px] border-app-border text-app-muted hover:bg-[var(--surface-raised)] hover:text-app-text transition"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Printable content */}
      <div className="space-y-6">
        {/* Print header */}
        <div className="hidden print:block print-only mb-6">
          <h1 className="text-2xl font-bold">Wallety — Relatório de {reportType === "income" ? "Receitas" : "Despesas"}</h1>
          <p className="text-sm text-slate-500">Período: {startDate} a {endDate} · Agrupado por: {groupBy === "category" ? "Categoria" : groupBy === "bank" ? "Banco" : groupBy === "paymentMethod" ? "Forma de Pagamento" : "Usuário"}</p>
        </div>

        {isLoading ? (
          <div className="text-center text-app-muted py-12 text-sm">Carregando relatório...</div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-[14px] border border-app-border p-12 text-center shadow-card">
            <div className="text-4xl mb-3">📊</div>
            <p className="text-app-muted text-sm">Nenhum dado encontrado para o período selecionado</p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div
              className={`rounded-[14px] p-5 ${reportType === "income" ? "bg-emerald-500 dark:bg-emerald-700" : "bg-red-400 dark:bg-red-700"}`}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.07em] text-white/80 mb-1.5">Total de {reportType === "income" ? "Receitas" : "Despesas"}</p>
              <p className="text-[28px] font-bold font-mono text-white">{formatCurrency(data?.grandTotal ?? 0)}</p>
              <p className="text-[12px] text-white/70 mt-1">{items.length} {groupBy === "category" ? "categorias" : groupBy === "bank" ? "bancos" : groupBy === "paymentMethod" ? "formas de pagamento" : "usuários"}</p>
            </div>

            {/* Fixed vs Variable — expenses only, purely informational */}
            {reportType === "expense" && data?.fixedTotal !== undefined && (() => {
              const fixed    = data.fixedTotal    ?? 0;
              const variable = data.variableTotal ?? 0;
              const total    = fixed + variable;
              const fixedPct = total > 0 ? (fixed    / total) * 100 : 0;
              const varPct   = total > 0 ? (variable / total) * 100 : 0;
              return (
                <div className="bg-[var(--surface-card)] rounded-[14px] border border-app-border shadow-card p-5 space-y-4">
                  <h2 className="text-[14px] font-bold text-app-text">Fixos vs Variáveis</h2>

                  {/* Split bar */}
                  <div className="h-2 w-full rounded-full overflow-hidden flex bg-[var(--surface-raised)]">
                    <div className="h-full bg-violet-500 transition-all duration-500" style={{ width: `${fixedPct}%` }} />
                    <div className="h-full bg-sky-400 transition-all duration-500"   style={{ width: `${varPct}%`   }} />
                  </div>

                  {/* Stat rows */}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    {[
                      { label: "Fixos",     value: fixed,    pct: fixedPct, color: "bg-violet-500", textColor: "text-violet-500", Icon: Repeat2 },
                      { label: "Variáveis", value: variable, pct: varPct,   color: "bg-sky-400",    textColor: "text-sky-500",    Icon: Shuffle },
                    ].map(({ label, value, pct, color, textColor, Icon }) => (
                      <div key={label} className="flex items-start gap-2.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${color} shrink-0 mt-1`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-0.5">
                            <Icon size={11} className={textColor} />
                            <span className="text-[11px] font-semibold text-app-muted">{label}</span>
                          </div>
                          <p className="text-[15px] font-bold font-mono text-app-text tabular-nums leading-tight">{formatCurrency(value)}</p>
                          <p className={`text-[11px] font-semibold tabular-nums ${textColor}`}>{pct.toFixed(1)}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Bar chart card */}
            <div className="bg-[var(--surface-card)] rounded-[14px] border border-app-border shadow-card overflow-hidden">
              <div className="p-5">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-[14px] font-bold text-app-text">
                    {reportType === "income" ? "Receitas" : "Despesas"} por {groupBy === "category" ? "Categoria" : groupBy === "bank" ? "Banco" : groupBy === "paymentMethod" ? "Forma de Pagamento" : "Usuário"}
                  </h2>
                  <span className="text-[11px] text-app-muted">{items.length} {groupBy === "category" ? "categorias" : groupBy === "bank" ? "bancos" : groupBy === "paymentMethod" ? "formas de pagamento" : "usuários"}</span>
                </div>
                <p className="text-[11px] text-app-muted mb-4">Clique em um item para ver os lançamentos</p>

                {/* Cost-type filter chips — expense mode only */}
                {reportType === "expense" && (
                  <div className="flex items-center gap-2 mb-5">
                    {([
                      { key: "all",      label: "Todos",     icon: <Layers size={11} /> },
                      { key: "fixed",    label: "Fixos",     icon: <Repeat2 size={11} /> },
                      { key: "variable", label: "Variáveis", icon: <Shuffle  size={11} /> },
                    ] as const).map(({ key, label, icon }) => {
                      const active = costTypeFilter === key;
                      const activeStyle =
                        key === "fixed"    ? "bg-violet-500 border-violet-500 text-white" :
                        key === "variable" ? "bg-sky-500 border-sky-500 text-white" :
                        "bg-brand-600 border-brand-600 text-white";
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => { setCostTypeFilter(key); closeDrilldown(); }}
                          className={[
                            "flex items-center gap-1.5 px-3 h-7 rounded-full text-[12px] font-semibold border transition-all",
                            active ? activeStyle : "border-app-border text-app-muted hover:border-app-text hover:text-app-text bg-[var(--surface-card)]",
                          ].join(" ")}
                        >
                          {icon}{label}
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className="space-y-1.5">
                  {items.map((item, index) => {
                    const color      = COLORS[index % COLORS.length];
                    const isSelected = drilldown?.groupKey === item.groupKey;
                    const sign       = reportType === "income" ? "+" : "−";
                    const valueColor = reportType === "income" ? "text-income" : "text-expense";

                    return (
                      <div key={index} className="rounded-xl overflow-hidden">
                        {/* ── Row button ── */}
                        <button
                          onClick={() => isSelected ? closeDrilldown() : openDrilldown(item, index)}
                          className={[
                            "w-full text-left px-3.5 py-3 transition-colors duration-150",
                            isSelected
                              ? "rounded-t-xl"
                              : "rounded-xl hover:bg-[var(--surface-raised)]",
                          ].join(" ")}
                          style={isSelected ? { background: color + "14" } : {}}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-[3px] h-3.5 rounded-full shrink-0" style={{ background: color }} />
                            <span className={`text-[13px] font-semibold truncate flex-1 ${isSelected ? "text-brand-500" : "text-app-text"}`}>
                              {item.label}
                            </span>
                            <span className="text-[11px] text-app-muted shrink-0 font-mono tabular-nums">{item.count} lanç.</span>
                            <span className="text-[12px] font-mono font-semibold tabular-nums shrink-0" style={{ color }}>
                              {formatCurrency(item.total)}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 tabular-nums" style={{ background: color + "20", color }}>
                              {item.percentage.toFixed(1)}%
                            </span>
                            <ChevronDown
                              size={14}
                              className={`text-app-muted shrink-0 transition-transform duration-200 ${isSelected ? "rotate-180" : ""}`}
                            />
                          </div>
                          <div className="h-[6px] w-full rounded-full overflow-hidden" style={{ background: "var(--surface-raised)" }}>
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${item.percentage}%`, background: color }}
                            />
                          </div>
                        </button>

                        {/* ── Inline accordion panel ── */}
                        {isSelected && (
                          <div
                            ref={drilldownRef}
                            className="animate-fade-in rounded-b-xl overflow-hidden border border-t-0"
                            style={{ borderColor: color + "35" }}
                          >
                            {drillLoading ? (
                              <p className="text-[12px] text-app-muted py-6 text-center bg-[var(--surface-raised)]">
                                Carregando lançamentos...
                              </p>
                            ) : drillTxns.length === 0 ? (
                              <p className="text-[12px] text-app-muted py-6 text-center bg-[var(--surface-raised)]">
                                Nenhum lançamento encontrado
                              </p>
                            ) : (
                              <>
                                <div className="divide-y divide-[var(--surface-divider)]">
                                  {drillTxns.map((t) => (
                                    <div
                                      key={t.id}
                                      className="flex items-center gap-3 px-4 py-3 bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] transition"
                                    >
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[12px] font-medium text-app-text truncate">{t.description}</p>
                                        {t.notes && <p className="text-[11px] text-app-muted truncate">{t.notes}</p>}
                                        <p className="text-[11px] text-app-muted mt-0.5">{formatDate(t.effectiveDate ?? t.date)}</p>
                                      </div>
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <span className={`text-[12px] font-mono font-semibold tabular-nums ${valueColor}`}>
                                          {sign}{formatCurrency(t.value)}
                                        </span>
                                        {t.isPaid
                                          ? <CheckCircle2 size={12} className="text-income" />
                                          : <Circle      size={12} className="text-app-muted" />}
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* Summary footer */}
                                <div
                                  className="flex items-center justify-between px-4 py-2.5 border-t"
                                  style={{ background: color + "10", borderColor: color + "25" }}
                                >
                                  <span className="text-[11px] font-semibold text-app-muted">
                                    {drillTxns.length} lançamento(s)
                                  </span>
                                  <span className={`text-[12px] font-mono font-bold tabular-nums ${valueColor}`}>
                                    {sign}{formatCurrency(drillTxns.reduce((a, t) => a + parseFloat(t.value), 0))}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
