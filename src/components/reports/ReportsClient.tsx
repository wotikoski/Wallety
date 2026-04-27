"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useActiveGroup } from "@/lib/hooks/useActiveGroup";
import { useState, useRef, useEffect } from "react";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import { TrendingUp, TrendingDown, CheckCircle2, Circle, ChevronLeft, ChevronRight, Repeat2, Shuffle } from "lucide-react";
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
  const [costDrilldown, setCostDrilldown] = useState<"fixed" | "variable" | null>(null);

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

  const { data, isLoading } = useQuery<ReportData>({
    queryKey: ["report", reportType, startDate, endDate, groupBy, activeGroupId],
    queryFn: () =>
      fetch(`/api/reports/${reportType === "income" ? "income" : "expenses"}?${params}`).then((r) => r.json()),
  });

  // Drill-down: fetch individual transactions for the selected group,
  // using effectiveDate range to match the report's bucketing logic.
  // Cost-type drilldown query (fixed / variable)
  const costDrillParams = new URLSearchParams({
    effectiveStartDate: startDate,
    effectiveEndDate: endDate,
    type: "expense",
    limit: "500",
    costType: costDrilldown ?? "",
  });
  if (activeGroupId) costDrillParams.set("groupId", activeGroupId);

  const { data: costDrillData, isLoading: costDrillLoading } = useQuery<{ transactions: DrillTransaction[] }>({
    queryKey: ["report-cost-drilldown", costDrilldown, startDate, endDate, activeGroupId],
    queryFn: () => fetch(`/api/transactions?${costDrillParams}`).then((r) => r.json()),
    enabled: !!costDrilldown,
  });

  const costDrillRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!costDrilldown || !costDrillRef.current) return;
    const el = costDrillRef.current;
    const timer = setTimeout(() => {
      const scrollParent = el.closest<HTMLElement>(".overflow-y-auto") ?? document.documentElement;
      const top = el.getBoundingClientRect().top + scrollParent.scrollTop - 80;
      scrollParent.scrollTo({ top, behavior: "smooth" });
    }, 200);
    return () => clearTimeout(timer);
  }, [costDrilldown]);

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
    queryFn: () => fetch(`/api/transactions?${drillParams}`).then((r) => r.json()),
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
    setCostDrilldown(null);
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

            {/* Fixed vs Variable — expenses only */}
            {reportType === "expense" && (data?.fixedTotal !== undefined) && (
              (() => {
                const fixed = data.fixedTotal ?? 0;
                const variable = data.variableTotal ?? 0;
                const total = fixed + variable;
                const fixedPct = total > 0 ? (fixed / total) * 100 : 0;
                const varPct = total > 0 ? (variable / total) * 100 : 0;
                return (
                  <div className="bg-[var(--surface-card)] rounded-[14px] border border-app-border p-5 shadow-card">
                    <h2 className="text-[14px] font-bold text-app-text mb-4">Fixos vs Variáveis</h2>
                    {/* Split bar */}
                    <div className="h-3 w-full rounded-full overflow-hidden flex mb-4">
                      <div className="h-full bg-violet-500 transition-all duration-500" style={{ width: `${fixedPct}%` }} />
                      <div className="h-full bg-sky-400 transition-all duration-500" style={{ width: `${varPct}%` }} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setCostDrilldown(costDrilldown === "fixed" ? null : "fixed")}
                        className={`text-left rounded-xl p-4 transition-all ${costDrilldown === "fixed" ? "bg-violet-100 ring-2 ring-violet-400" : "bg-violet-50 hover:bg-violet-100"} dark:bg-violet-950/30`}
                      >
                        <div className="flex items-center gap-1.5 mb-2">
                          <Repeat2 size={13} className="text-violet-500" />
                          <span className="text-[11px] font-bold uppercase tracking-wide text-violet-600">Fixos</span>
                        </div>
                        <p className="text-[18px] font-bold font-mono text-violet-700 dark:text-violet-300">{formatCurrency(fixed)}</p>
                        <p className="text-[11px] text-violet-500 mt-0.5">{fixedPct.toFixed(1)}% do total</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCostDrilldown(costDrilldown === "variable" ? null : "variable")}
                        className={`text-left rounded-xl p-4 transition-all ${costDrilldown === "variable" ? "bg-sky-100 ring-2 ring-sky-400" : "bg-sky-50 hover:bg-sky-100"} dark:bg-sky-950/30`}
                      >
                        <div className="flex items-center gap-1.5 mb-2">
                          <Shuffle size={13} className="text-sky-500" />
                          <span className="text-[11px] font-bold uppercase tracking-wide text-sky-600">Variáveis</span>
                        </div>
                        <p className="text-[18px] font-bold font-mono text-sky-700 dark:text-sky-300">{formatCurrency(variable)}</p>
                        <p className="text-[11px] text-sky-500 mt-0.5">{varPct.toFixed(1)}% do total</p>
                      </button>
                    </div>

                    {/* Cost-type drilldown — same inline style as category drilldown */}
                    {costDrilldown && (
                      (() => {
                        const color = costDrilldown === "fixed" ? "#8b5cf6" : "#38bdf8";
                        return (
                          <div ref={costDrillRef} className="mt-3 mx-0 rounded-xl border animate-fade-in overflow-hidden" style={{ borderColor: color + "40", background: color + "08" }}>
                            {costDrillLoading ? (
                              <p className="text-[12px] text-app-muted py-4 text-center">Carregando...</p>
                            ) : !costDrillData?.transactions?.length ? (
                              <p className="text-[12px] text-app-muted py-4 text-center">Nenhum lançamento encontrado</p>
                            ) : (
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b" style={{ borderColor: color + "30" }}>
                                    <th className="text-left px-3.5 py-2 text-[11px] font-bold text-app-muted uppercase tracking-[0.07em]">Data</th>
                                    <th className="text-left py-2 text-[11px] font-bold text-app-muted uppercase tracking-[0.07em]">Descrição</th>
                                    <th className="text-right px-3.5 py-2 text-[11px] font-bold text-app-muted uppercase tracking-[0.07em]">Valor</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y" style={{ borderColor: color + "20" }}>
                                  {costDrillData.transactions.map((t) => (
                                    <tr key={t.id} className="hover:bg-black/5 transition">
                                      <td className="px-3.5 py-2 text-[12px] text-app-muted whitespace-nowrap w-24">{formatDate(t.effectiveDate ?? t.date)}</td>
                                      <td className="py-2 text-[13px] text-app-text font-medium">
                                        {t.description}
                                        {t.notes && <p className="text-[11px] text-app-muted font-normal mt-0.5">{t.notes}</p>}
                                      </td>
                                      <td className="px-3.5 py-2 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                          <span className="text-[13px] font-mono font-semibold text-expense">
                                            −{formatCurrency(t.value)}
                                          </span>
                                          {t.isPaid ? <CheckCircle2 size={13} className="text-income shrink-0" /> : <Circle size={13} className="text-app-muted shrink-0" />}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot className="border-t" style={{ borderColor: color + "30" }}>
                                  <tr>
                                    <td colSpan={2} className="px-3.5 py-2 text-[12px] font-semibold text-app-text">{costDrillData.transactions.length} lançamento(s)</td>
                                    <td className="px-3.5 py-2 text-right">
                                      <span className="text-[13px] font-mono font-bold text-expense">
                                        −{formatCurrency(costDrillData.transactions.reduce((a, t) => a + parseFloat(t.value), 0))}
                                      </span>
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            )}
                          </div>
                        );
                      })()
                    )}
                  </div>
                );
              })()
            )}

            {/* Custom horizontal bar chart */}
            <div className="bg-[var(--surface-card)] rounded-[14px] border border-app-border p-5 shadow-card">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-[14px] font-bold text-app-text">
                  {reportType === "income" ? "Receitas" : "Despesas"} por {groupBy === "category" ? "Categoria" : groupBy === "bank" ? "Banco" : groupBy === "paymentMethod" ? "Forma de Pagamento" : "Usuário"}
                </h2>
                <span className="text-[11px] text-app-muted">{items.length} {groupBy === "category" ? "categorias" : groupBy === "bank" ? "bancos" : groupBy === "paymentMethod" ? "formas de pagamento" : "usuários"}</span>
              </div>
              <p className="text-[11px] text-app-muted mb-5">Clique em um item para ver os lançamentos</p>

              <div className="space-y-1.5">
                {items.map((item, index) => {
                  const color = COLORS[index % COLORS.length];
                  const isSelected = drilldown?.groupKey === item.groupKey;
                  const isDimmed = !!drilldown && !isSelected;
                  return (
                    <div key={index}>
                      <button
                        onClick={() => isSelected ? closeDrilldown() : openDrilldown(item, index)}
                        className="w-full text-left rounded-xl px-3.5 py-3 transition-all duration-150"
                        style={{
                          opacity: isDimmed ? 0.4 : 1,
                          ...(isSelected
                            ? { background: color + "12", boxShadow: `0 4px 20px ${color}28` }
                            : {}),
                        }}
                        onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.08)"; }}
                        onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
                      >
                        {/* Top row: name · count  |  value  pct-badge */}
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-[3px] h-3.5 rounded-full shrink-0" style={{ background: color }} />
                          <span className={`text-[13px] font-semibold truncate flex-1 ${isSelected ? "text-brand-500" : "text-app-text"}`}>
                            {item.label}
                          </span>
                          <span className="text-[11px] text-app-muted shrink-0 font-mono tabular-nums">
                            {item.count} lanç.
                          </span>
                          <span className="text-[12px] font-mono font-semibold tabular-nums shrink-0" style={{ color }}>
                            {formatCurrency(item.total)}
                          </span>
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 tabular-nums"
                            style={{ background: color + "20", color }}
                          >
                            {item.percentage.toFixed(1)}%
                          </span>
                        </div>
                        {/* Bar track */}
                        <div className="h-[7px] w-full rounded-full overflow-hidden" style={{ background: "var(--surface-raised)" }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${item.percentage}%`, background: `linear-gradient(90deg, ${color}cc, ${color})` }}
                          />
                        </div>
                      </button>

                      {/* Inline drilldown — expands below the selected item */}
                      {isSelected && (
                        <div ref={drilldownRef} className="mx-1 mb-2 rounded-xl border animate-fade-in overflow-hidden" style={{ borderColor: color + "40", background: color + "08" }}>
                          {drillLoading ? (
                            <p className="text-[12px] text-app-muted py-4 text-center">Carregando lançamentos...</p>
                          ) : drillTxns.length === 0 ? (
                            <p className="text-[12px] text-app-muted py-4 text-center">Nenhum lançamento encontrado</p>
                          ) : (
                            <table className="w-full">
                              <thead>
                                <tr className="border-b" style={{ borderColor: color + "30" }}>
                                  <th className="text-left px-3.5 py-2 text-[11px] font-bold text-app-muted uppercase tracking-[0.07em]">Data</th>
                                  <th className="text-left py-2 text-[11px] font-bold text-app-muted uppercase tracking-[0.07em]">Descrição</th>
                                  <th className="text-right px-3.5 py-2 text-[11px] font-bold text-app-muted uppercase tracking-[0.07em]">Valor</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y" style={{ borderColor: color + "20" }}>
                                {drillTxns.map((t) => (
                                  <tr key={t.id} className="hover:bg-black/5 transition">
                                    <td className="px-3.5 py-2 text-[12px] text-app-muted whitespace-nowrap w-24">{formatDate(t.effectiveDate ?? t.date)}</td>
                                    <td className="py-2 text-[13px] text-app-text font-medium">
                                      {t.description}
                                      {t.notes && <p className="text-[11px] text-app-muted font-normal mt-0.5">{t.notes}</p>}
                                    </td>
                                    <td className="px-3.5 py-2 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <span className={`text-[13px] font-mono font-semibold ${reportType === "income" ? "text-income" : "text-expense"}`}>
                                          {reportType === "income" ? "+" : "−"}{formatCurrency(t.value)}
                                        </span>
                                        {t.isPaid ? <CheckCircle2 size={13} className="text-income shrink-0" /> : <Circle size={13} className="text-app-muted shrink-0" />}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot className="border-t" style={{ borderColor: color + "30" }}>
                                <tr>
                                  <td colSpan={2} className="px-3.5 py-2 text-[12px] font-semibold text-app-text">{drillTxns.length} lançamento(s)</td>
                                  <td className="px-3.5 py-2 text-right">
                                    <span className={`text-[13px] font-mono font-bold ${reportType === "income" ? "text-income" : "text-expense"}`}>
                                      {formatCurrency(drillTxns.reduce((a, t) => a + parseFloat(t.value), 0))}
                                    </span>
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>


</>
        )}
      </div>
    </div>
  );
}
