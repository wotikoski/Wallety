"use client";

import { useQuery } from "@tanstack/react-query";
import { useActiveGroup } from "@/lib/hooks/useActiveGroup";
import { useState, useRef, useEffect } from "react";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { TrendingUp, TrendingDown, CheckCircle2, Circle, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: "smooth" });
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
            className="h-9 w-9 flex items-center justify-center rounded-[10px] border-[1.5px] border-app-border text-app-muted hover:bg-white hover:text-app-text transition"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => navigateMonth(1)}
            className="h-9 w-9 flex items-center justify-center rounded-[10px] border-[1.5px] border-app-border text-app-muted hover:bg-white hover:text-app-text transition"
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

            {/* Chart — desktop only */}
            <div className="hidden md:block bg-white rounded-[14px] border border-app-border p-5 shadow-card">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-[14px] font-bold text-app-text">
                  {reportType === "income" ? "Receitas" : "Despesas"} por {groupBy === "category" ? "Categoria" : groupBy === "bank" ? "Banco" : "Usuário"}
                </h2>
                {drilldown && (
                  <button
                    onClick={closeDrilldown}
                    className="text-[11px] text-app-muted hover:text-app-text transition px-2 py-1 rounded-lg hover:bg-[#f1f3f9]"
                  >
                    Fechar ✕
                  </button>
                )}
              </div>
              <p className="text-[11px] text-app-muted mb-4">Clique em uma barra para ver os lançamentos</p>
              <ResponsiveContainer width="100%" height={Math.max(260, items.length * 46)}>
                <BarChart data={items} layout="vertical" margin={{ top: 0, right: 180, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f9" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 12, fill: "#64748b" }} width={130} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v: number) => formatCurrency(v)}
                    contentStyle={{ background: "#fff", border: "1px solid #e2e5ef", borderRadius: 10, fontSize: 12, boxShadow: "0 4px 16px rgba(0,0,0,.08)" }}
                    cursor={false}
                  />
                  <Bar
                    dataKey="total"
                    radius={[0, 5, 5, 0]}
                    cursor="pointer"
                    isAnimationActive={false}
                    onClick={(barData, index) => openDrilldown(barData as ReportItem, index)}
                    onMouseEnter={(_, index) => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    label={({ x, y, width, height, value, index: i }: { x: number; y: number; width: number; height: number; value: number; index: number }) => {
                      const item = items[i];
                      if (!item) return <g />;
                      return (
                        <text x={x + width + 10} y={y + height / 2} fill="#64748b" fontSize={12} dominantBaseline="middle">
                          {formatCurrency(value)}
                          <tspan fill="#94a3b8" fontSize={11}> · {item.percentage.toFixed(1)}%</tspan>
                        </text>
                      );
                    }}
                  >
                    {items.map((item, index) => {
                      const isSelected = drilldown?.groupKey === item.groupKey;
                      const isHovered = hoveredIndex === index;
                      let opacity = 1;
                      if (drilldown && !isSelected) opacity = 0.25;
                      else if (!drilldown && hoveredIndex !== null && !isHovered) opacity = 0.6;
                      return (
                        <Cell
                          key={index}
                          fill={COLORS[index % COLORS.length]}
                          opacity={opacity}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Inline drilldown panel — desktop */}
              {drilldown && (
                <div ref={drilldownRef} className="mt-4 border-t border-[#f1f3f9] pt-4 animate-fade-in">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: drilldown.color }} />
                    <h3 className="text-[13px] font-semibold text-app-text">{drilldown.label}</h3>
                  </div>
                  {drillLoading ? (
                    <p className="text-[12px] text-app-muted py-3 text-center">Carregando lançamentos...</p>
                  ) : drillTxns.length === 0 ? (
                    <p className="text-[12px] text-app-muted py-3 text-center">Nenhum lançamento encontrado</p>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#f1f3f9]">
                          <th className="text-left pb-2 text-[11px] font-bold text-app-muted uppercase tracking-[0.07em]">Data</th>
                          <th className="text-left pb-2 text-[11px] font-bold text-app-muted uppercase tracking-[0.07em]">Descrição</th>
                          <th className="text-right pb-2 text-[11px] font-bold text-app-muted uppercase tracking-[0.07em]">Pago</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f8f9fd]">
                        {drillTxns.map((t) => (
                          <tr key={t.id} className="hover:bg-[#f8f9fd] transition">
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
                                {t.isPaid ? <CheckCircle2 size={13} className="text-income shrink-0" /> : <Circle size={13} className="text-slate-300 shrink-0" />}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="border-t border-[#e2e5ef]">
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
            </div>

            {/* Summary — mobile cards */}
            <div className="md:hidden bg-white rounded-[14px] border border-app-border shadow-card overflow-hidden">
              {items.map((item, index) => {
                const isSelected = drilldown?.groupKey === item.groupKey;
                return (
                  <div key={index} className="border-b border-[#f1f3f9] last:border-0">
                    <button
                      onClick={() => isSelected ? closeDrilldown() : openDrilldown(item, index)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 transition text-left ${isSelected ? "bg-[rgba(99,102,241,.06)]" : "hover:bg-[rgba(99,102,241,.03)]"}`}
                    >
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] font-semibold truncate ${isSelected ? "text-brand-500" : "text-app-text"}`}>{item.label}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 prog-track" style={{ height: 4 }}>
                            <div className="prog-fill" style={{ width: `${item.percentage}%`, background: COLORS[index % COLORS.length] }} />
                          </div>
                          <span className="text-[11px] text-app-muted shrink-0">{item.percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className={`text-[13px] font-semibold font-mono ${reportType === "income" ? "text-income" : "text-expense"}`}>
                          {formatCurrency(item.total)}
                        </p>
                        <p className="text-[11px] text-app-muted">{item.count} lanç.</p>
                      </div>
                      <ChevronDown size={14} className={`text-app-muted shrink-0 transition-transform ${isSelected ? "rotate-180" : ""}`} />
                    </button>

                    {/* Inline transactions */}
                    {isSelected && (
                      <div className="px-4 pb-3 pt-1 bg-[#f8f9fd] border-t border-[#f1f3f9]">
                        {drillLoading ? (
                          <p className="text-[12px] text-app-muted py-2 text-center">Carregando lançamentos...</p>
                        ) : drillTxns.length === 0 ? (
                          <p className="text-[12px] text-app-muted py-2 text-center">Nenhum lançamento encontrado</p>
                        ) : (
                          <div className="space-y-0.5 mt-1">
                            {drillTxns.map((t) => (
                              <div key={t.id} className="flex items-center gap-2 py-1.5 border-b border-[#eff0f6] last:border-0">
                                <span className="text-[11px] text-app-muted whitespace-nowrap w-16 shrink-0">{formatDate(t.effectiveDate ?? t.date)}</span>
                                <span className="flex-1 text-[12px] text-app-text font-medium truncate">{t.description}</span>
                                <span className={`text-[12px] font-mono font-semibold shrink-0 ${reportType === "income" ? "text-income" : "text-expense"}`}>
                                  {reportType === "income" ? "+" : "−"}{formatCurrency(t.value)}
                                </span>
                                {t.isPaid ? <CheckCircle2 size={12} className="text-income shrink-0" /> : <Circle size={12} className="text-slate-300 shrink-0" />}
                              </div>
                            ))}
                            <div className="flex justify-between pt-2 text-[12px] font-semibold text-app-text">
                              <span>{drillTxns.length} lançamento(s)</span>
                              <span className={`font-mono ${reportType === "income" ? "text-income" : "text-expense"}`}>
                                {formatCurrency(drillTxns.reduce((a, t) => a + parseFloat(t.value), 0))}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="flex items-center justify-between px-4 py-3 bg-[#f8f9fd] border-t border-app-border">
                <span className="text-[13px] font-semibold text-app-text">Total</span>
                <span className={`text-[13px] font-bold font-mono ${reportType === "income" ? "text-income" : "text-expense"}`}>
                  {formatCurrency(data?.grandTotal ?? 0)}
                </span>
              </div>
            </div>


          </>
        )}
      </div>
    </div>
  );
}
