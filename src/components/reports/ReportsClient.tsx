"use client";

import { useQuery } from "@tanstack/react-query";
import { useActiveGroup } from "@/lib/hooks/useActiveGroup";
import { useState } from "react";
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
import { TrendingUp, TrendingDown, ArrowLeft, CheckCircle2, Circle, ChevronLeft, ChevronRight } from "lucide-react";
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

            {/* Chart */}
            <div className="bg-white rounded-[14px] border border-app-border p-4 md:p-5 shadow-card">
              <h2 className="text-[14px] font-bold text-app-text mb-1">
                {reportType === "income" ? "Receitas" : "Despesas"} por {groupBy === "category" ? "Categoria" : groupBy === "bank" ? "Banco" : "Usuário"}
              </h2>
              <p className="text-[11px] text-app-muted mb-4">Clique em uma barra para ver os lançamentos</p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={items} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f9" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} width={120} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v: number) => formatCurrency(v)}
                    contentStyle={{ background: "#fff", border: "1px solid #e2e5ef", borderRadius: 10, fontSize: 12, boxShadow: "0 4px 16px rgba(0,0,0,.08)" }}
                  />
                  <Bar
                    dataKey="total"
                    radius={[0, 5, 5, 0]}
                    cursor="pointer"
                    onClick={(barData, index) => openDrilldown(barData as ReportItem, index)}
                  >
                    {items.map((item, index) => (
                      <Cell
                        key={index}
                        fill={COLORS[index % COLORS.length]}
                        opacity={drilldown && drilldown.groupKey !== item.groupKey ? 0.3 : 1}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Summary — mobile cards */}
            <div className="md:hidden bg-white rounded-[14px] border border-app-border shadow-card overflow-hidden">
              {items.map((item, index) => {
                const isSelected = drilldown?.groupKey === item.groupKey;
                return (
                  <button
                    key={index}
                    onClick={() => isSelected ? closeDrilldown() : openDrilldown(item, index)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 border-b border-[#f1f3f9] last:border-0 transition text-left ${isSelected ? "bg-[rgba(99,102,241,.06)]" : "hover:bg-[#f8f9fd]"}`}
                  >
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-semibold truncate ${isSelected ? "text-brand-500" : "text-app-text"}`}>{item.label}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 prog-track" style={{ height: 4 }}>
                          <div
                            className="prog-fill"
                            style={{ width: `${item.percentage}%`, background: COLORS[index % COLORS.length] }}
                          />
                        </div>
                        <span className="text-[11px] text-app-muted shrink-0">{item.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-[13px] font-semibold font-mono ${reportType === "income" ? "text-income" : "text-expense"}`}>
                        {formatCurrency(item.total)}
                      </p>
                      <p className="text-[11px] text-app-muted">{item.count} lanç.</p>
                    </div>
                  </button>
                );
              })}
              <div className="flex items-center justify-between px-4 py-3 bg-[#f8f9fd] border-t border-app-border">
                <span className="text-[13px] font-semibold text-app-text">Total</span>
                <span className={`text-[13px] font-bold font-mono ${reportType === "income" ? "text-income" : "text-expense"}`}>
                  {formatCurrency(data?.grandTotal ?? 0)}
                </span>
              </div>
            </div>

            {/* Summary table — desktop */}
            <div className="hidden md:block bg-white rounded-[14px] border border-app-border shadow-card overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead className="bg-[#f8f9fd] border-b border-[#f1f3f9]">
                  <tr>
                    <th className="text-left px-5 py-3 text-[11px] font-bold text-app-muted uppercase tracking-[0.07em]">
                      {groupBy === "category" ? "Categoria" : groupBy === "bank" ? "Banco" : "Usuário"}
                    </th>
                    <th className="text-right px-5 py-3 text-[11px] font-bold text-app-muted uppercase tracking-[0.07em]">Transações</th>
                    <th className="text-right px-5 py-3 text-[11px] font-bold text-app-muted uppercase tracking-[0.07em]">Total</th>
                    <th className="text-right px-5 py-3 text-[11px] font-bold text-app-muted uppercase tracking-[0.07em]">% do Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f3f9]">
                  {items.map((item, index) => {
                    const isSelected = drilldown?.groupKey === item.groupKey;
                    return (
                      <tr
                        key={index}
                        onClick={() => isSelected ? closeDrilldown() : openDrilldown(item, index)}
                        className={`transition cursor-pointer ${isSelected ? "bg-[rgba(99,102,241,.06)]" : "hover:bg-[#f8f9fd]"}`}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            <span className={`text-[13px] font-semibold ${isSelected ? "text-brand-500" : "text-app-text"}`}>{item.label}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right text-[13px] text-app-muted">{item.count}</td>
                        <td className="px-5 py-3.5 text-right">
                          <span className={`text-[13px] font-semibold font-mono ${reportType === "income" ? "text-income" : "text-expense"}`}>
                            {formatCurrency(item.total)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            <div className="w-16 prog-track" style={{ height: 5 }}>
                              <div
                                className="prog-fill"
                                style={{ width: `${item.percentage}%`, background: COLORS[index % COLORS.length] }}
                              />
                            </div>
                            <span className="text-[12px] text-app-muted min-w-[38px] text-right">
                              {item.percentage.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-[#f8f9fd] border-t border-app-border">
                  <tr>
                    <td className="px-5 py-3 text-[13px] font-semibold text-app-text">Total</td>
                    <td className="px-5 py-3 text-right text-[13px] font-semibold text-app-text">
                      {items.reduce((a, i) => a + i.count, 0)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={`text-[13px] font-bold font-mono ${reportType === "income" ? "text-income" : "text-expense"}`}>
                        {formatCurrency(data?.grandTotal ?? 0)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-[13px] font-semibold text-app-muted">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Drill-down panel */}
            {drilldown && (
              <div className="bg-white rounded-[14px] border border-app-border shadow-card overflow-hidden animate-fade-in">
                <div
                  className="px-5 py-4 border-b border-[#f1f3f9] flex items-center justify-between"
                  style={{ borderLeftWidth: 3, borderLeftColor: drilldown.color, borderLeftStyle: "solid" }}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={closeDrilldown}
                      className="p-1.5 text-app-muted hover:text-app-text hover:bg-[#f1f3f9] rounded-lg transition"
                    >
                      <ArrowLeft size={15} />
                    </button>
                    <div>
                      <h3 className="text-[13px] font-semibold text-app-text">{drilldown.label}</h3>
                      <p className="text-[11px] text-app-muted mt-0.5">
                        {drillLoading ? "Carregando..." : `${drillTxns.length} lançamento(s) · ${formatCurrency(drillTxns.reduce((a, t) => a + parseFloat(t.value), 0))}`}
                      </p>
                    </div>
                  </div>
                </div>

                {drillLoading ? (
                  <div className="py-10 text-center text-app-muted text-sm">Carregando lançamentos...</div>
                ) : drillTxns.length === 0 ? (
                  <div className="py-10 text-center text-app-muted text-sm">Nenhum lançamento encontrado</div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-[#f8f9fd] border-b border-[#f1f3f9]">
                      <tr>
                        <th className="text-left px-5 py-3 text-[11px] font-bold text-app-muted uppercase tracking-[0.07em]">Data</th>
                        <th className="text-left px-5 py-3 text-[11px] font-bold text-app-muted uppercase tracking-[0.07em]">Descrição</th>
                        <th className="text-right px-5 py-3 text-[11px] font-bold text-app-muted uppercase tracking-[0.07em]">Valor</th>
                        <th className="text-center px-5 py-3 text-[11px] font-bold text-app-muted uppercase tracking-[0.07em]">Pago</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f3f9]">
                      {drillTxns.map((t) => (
                        <tr key={t.id} className="hover:bg-[#f8f9fd] transition">
                          <td className="px-5 py-3.5 text-[13px] text-app-muted whitespace-nowrap">
                            {formatDate(t.effectiveDate ?? t.date)}
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="text-[13px] font-semibold text-app-text">{t.description}</p>
                            {t.notes && <p className="text-[11px] text-app-muted mt-0.5">{t.notes}</p>}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <span className={`text-[13px] font-semibold font-mono ${reportType === "income" ? "text-income" : "text-expense"}`}>
                              {reportType === "income" ? "+" : "−"}{formatCurrency(t.value)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            {t.isPaid
                              ? <CheckCircle2 size={16} className="text-income mx-auto" />
                              : <Circle size={16} className="text-slate-300 mx-auto" />
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-[#f8f9fd] border-t border-app-border">
                      <tr>
                        <td colSpan={2} className="px-5 py-3 text-[13px] font-semibold text-app-text">Total</td>
                        <td className="px-5 py-3 text-right">
                          <span className={`text-[13px] font-bold font-mono ${reportType === "income" ? "text-income" : "text-expense"}`}>
                            {formatCurrency(drillTxns.reduce((a, t) => a + parseFloat(t.value), 0))}
                          </span>
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
