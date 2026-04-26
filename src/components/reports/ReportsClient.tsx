"use client";

import { useQuery } from "@tanstack/react-query";
import { useActiveGroup } from "@/lib/hooks/useActiveGroup";
import { useState, useRef, useEffect } from "react";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { TrendingUp, TrendingDown, CheckCircle2, Circle, ChevronLeft, ChevronRight } from "lucide-react";
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
  const now = new Date();

  const [startDate, setStartDate] = useState(format(startOfMonth(now), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(now), "yyyy-MM-dd"));
  const [groupBy, setGroupBy] = useState<"category" | "bank" | "user">("category");
  const [reportType, setReportType] = useState<"income" | "expense">("expense");
  const [drilldown, setDrilldown] = useState<Drilldown | null>(null);

  const params = new URLSearchParams({ startDate, endDate, groupBy });
  if (activeGroupId) params.set("groupId", activeGroupId);

  const { data, isLoading } = useQuery<ReportData>({
    queryKey: ["report", reportType, startDate, endDate, groupBy, activeGroupId],
    queryFn: () =>
      fetch(`/api/reports/${reportType === "income" ? "income" : "expenses"}?${params}`).then((r) => r.json()),
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
      // The scrollable container is <main> with overflow-y-auto, not window
      const scrollParent = el.closest<HTMLElement>(".overflow-y-auto") ?? document.documentElement;
      const top = el.getBoundingClientRect().top + scrollParent.scrollTop - 80;
      scrollParent.scrollTo({ top, behavior: "smooth" });
    }, 200);
    return () => clearTimeout(timer);
  }, [drilldown?.groupKey]);

  // Reset drilldown when filters change
  function handleFilterChange(fn: () => void) {
    closeDrilldown();
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
          <p className="text-sm text-slate-500">Período: {startDate} a {endDate} · Agrupado por: {groupBy === "category" ? "Categoria" : groupBy === "bank" ? "Banco" : "Usuário"}</p>
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
              className="rounded-[14px] p-5"
              style={{ background: reportType === "income" ? "#10b981" : "#f87171" }}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.07em] text-white/80 mb-1.5">Total de {reportType === "income" ? "Receitas" : "Despesas"}</p>
              <p className="text-[28px] font-bold font-mono text-white">{formatCurrency(data?.grandTotal ?? 0)}</p>
              <p className="text-[12px] text-white/70 mt-1">{items.length} {groupBy === "category" ? "categorias" : groupBy === "bank" ? "bancos" : "usuários"}</p>
            </div>

            {/* Category chart — Dashboard style */}
            <div className="bg-[var(--surface-card)] rounded-[14px] border border-app-border p-5 shadow-card">
              <h2 className="text-[14px] font-bold text-app-text mb-4">
                {reportType === "income" ? "Receitas" : "Despesas"} por {groupBy === "category" ? "Categoria" : groupBy === "bank" ? "Banco" : "Usuário"}
              </h2>
              <p className="text-[11px] text-app-muted -mt-2 mb-4">Clique em um item para ver os lançamentos</p>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Donut chart */}
                <div className="w-[160px] h-[160px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={items}
                        dataKey="total"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={72}
                        paddingAngle={2}
                        isAnimationActive={false}
                      >
                        {items.map((_, index) => (
                          <Cell
                            key={index}
                            fill={COLORS[index % COLORS.length]}
                            opacity={drilldown && drilldown.groupKey !== items[index]?.groupKey ? 0.25 : 1}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: number) => formatCurrency(v)}
                        contentStyle={{ background: "var(--surface-card)", border: "1px solid var(--color-border)", borderRadius: 10, fontSize: 12, color: "var(--color-text)" }}
                        labelStyle={{ color: "var(--color-text)" }}
                        itemStyle={{ color: "var(--color-text)" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Category list */}
                <div className="flex-1 min-w-0 space-y-1">
                  {items.map((item, index) => {
                    const color = COLORS[index % COLORS.length];
                    const isSelected = drilldown?.groupKey === item.groupKey;
                    return (
                      <button
                        key={index}
                        onClick={() => isSelected ? closeDrilldown() : openDrilldown(item, index)}
                        className="w-full text-left rounded-lg px-2.5 py-2 transition-all duration-150 hover:-translate-y-px"
                        style={isSelected ? { background: color + "14", boxShadow: `0 4px 16px ${color}30` } : {}}
                        onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"; }}
                        onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
                      >
                        {/* Row 1: dot + name + pct */}
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                          <span className={`text-[12px] font-semibold truncate flex-1 ${isSelected ? "text-brand-500" : "text-app-text"}`}>
                            {item.label}
                          </span>
                          <span className="text-[11px] text-app-muted shrink-0">{item.percentage.toFixed(1)}%</span>
                        </div>
                        {/* Row 2: progress + value */}
                        <div className="flex items-center gap-2 pl-3.5">
                          <div className="prog-track flex-1" style={{ height: 4 }}>
                            <div className="prog-fill" style={{ width: `${item.percentage}%`, background: color }} />
                          </div>
                          <span className="text-[12px] font-semibold text-app-muted font-mono shrink-0 tabular-nums">
                            {formatCurrency(item.total)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Drilldown panel — shown below cards when a category is selected */}
            {drilldown && (
              <div ref={drilldownRef} className="bg-[var(--surface-card)] rounded-[14px] border border-app-border shadow-card p-5 animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: drilldown.color }} />
                    <h3 className="text-[13px] font-semibold text-app-text">{drilldown.label}</h3>
                  </div>
                  <button
                    onClick={closeDrilldown}
                    className="text-[11px] text-app-muted hover:text-app-text transition px-2 py-1 rounded-lg hover:bg-[var(--surface-raised)]"
                  >
                    Fechar ✕
                  </button>
                </div>
                {drillLoading ? (
                  <p className="text-[12px] text-app-muted py-3 text-center">Carregando lançamentos...</p>
                ) : drillTxns.length === 0 ? (
                  <p className="text-[12px] text-app-muted py-3 text-center">Nenhum lançamento encontrado</p>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-app-border">
                        <th className="text-left pb-2 text-[11px] font-bold text-app-muted uppercase tracking-[0.07em]">Data</th>
                        <th className="text-left pb-2 text-[11px] font-bold text-app-muted uppercase tracking-[0.07em]">Descrição</th>
                        <th className="text-right pb-2 text-[11px] font-bold text-app-muted uppercase tracking-[0.07em]">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--surface-divider)]">
                      {drillTxns.map((t) => (
                        <tr key={t.id} className="hover:bg-[var(--surface-raised)] transition">
                          <td className="py-2.5 text-[12px] text-app-muted whitespace-nowrap pr-4 w-24">{formatDate(t.effectiveDate ?? t.date)}</td>
                          <td className="py-2.5 text-[13px] text-app-text font-medium">
                            {t.description}
                            {t.notes && <p className="text-[11px] text-app-muted font-normal mt-0.5">{t.notes}</p>}
                          </td>
                          <td className="py-2.5 text-right">
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
                    <tfoot className="border-t border-app-border">
                      <tr>
                        <td colSpan={2} className="pt-2.5 text-[12px] font-semibold text-app-text">{drillTxns.length} lançamento(s)</td>
                        <td className="pt-2.5 text-right">
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

            {/* Extra breathing room on mobile */}
            <div className="h-6 md:hidden" />

          </>
        )}
      </div>
    </div>
  );
}
