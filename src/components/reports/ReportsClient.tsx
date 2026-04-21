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
import { TrendingUp, TrendingDown, ArrowLeft, CheckCircle2, Circle } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";

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

const COLORS = ["#6173f4", "#16a34a", "#f97316", "#ec4899", "#8b5cf6", "#0ea5e9", "#dc2626", "#f59e0b", "#10b981", "#64748b"];

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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="no-print">
        <h1 className="text-2xl font-semibold text-slate-900">Relatórios</h1>
        <p className="text-slate-500 text-sm mt-0.5">Analise suas finanças por período</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex flex-wrap gap-4 items-end no-print">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Tipo de relatório</label>
          <div className="flex rounded-lg border border-slate-200 overflow-hidden h-[38px]">
            <button
              onClick={() => handleFilterChange(() => setReportType("income"))}
              className={`flex items-center gap-1.5 px-3 text-sm font-medium transition ${reportType === "income" ? "bg-income text-white" : "text-slate-500 hover:bg-slate-50"}`}
            >
              <TrendingUp size={14} /> Receitas
            </button>
            <button
              onClick={() => handleFilterChange(() => setReportType("expense"))}
              className={`flex items-center gap-1.5 px-3 text-sm font-medium transition ${reportType === "expense" ? "bg-expense text-white" : "text-slate-500 hover:bg-slate-50"}`}
            >
              <TrendingDown size={14} /> Despesas
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Data inicial</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => handleFilterChange(() => setStartDate(e.target.value))}
            className="w-[155px] h-[38px] text-sm border border-slate-200 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Data final</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => handleFilterChange(() => setEndDate(e.target.value))}
            className="w-[155px] h-[38px] text-sm border border-slate-200 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Agrupar por</label>
          <select
            value={groupBy}
            onChange={(e) => handleFilterChange(() => setGroupBy(e.target.value as "category" | "bank" | "user"))}
            className="w-[155px] h-[38px] text-sm border border-slate-200 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="category">Categoria</option>
            <option value="bank">Banco</option>
            {activeGroupId && <option value="user">Usuário</option>}
          </select>
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
          <div className="text-center text-slate-400 py-12">Carregando relatório...</div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 p-12 text-center shadow-sm">
            <div className="text-4xl mb-3">📊</div>
            <p className="text-slate-500 text-sm">Nenhum dado encontrado para o período selecionado</p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className={`rounded-xl p-6 text-white ${reportType === "income" ? "bg-income" : "bg-expense"}`}>
              <p className="text-sm font-medium opacity-80 mb-1">Total de {reportType === "income" ? "Receitas" : "Despesas"}</p>
              <p className="text-3xl font-bold font-mono">{formatCurrency(data?.grandTotal ?? 0)}</p>
              <p className="text-sm opacity-70 mt-1">{items.length} {groupBy === "category" ? "categorias" : groupBy === "bank" ? "bancos" : "usuários"}</p>
            </div>

            {/* Chart */}
            <div className="bg-white rounded-xl border border-slate-100 p-4 md:p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-800 mb-1">
                {reportType === "income" ? "Receitas" : "Despesas"} por {groupBy === "category" ? "Categoria" : groupBy === "bank" ? "Banco" : "Usuário"}
              </h2>
              <p className="text-xs text-slate-400 mb-4">Clique em uma barra para ver os lançamentos</p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={items} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} width={120} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar
                    dataKey="total"
                    radius={[0, 4, 4, 0]}
                    cursor="pointer"
                    onClick={(barData, index) => openDrilldown(barData as ReportItem, index)}
                  >
                    {items.map((item, index) => (
                      <Cell
                        key={index}
                        fill={COLORS[index % COLORS.length]}
                        opacity={drilldown && drilldown.groupKey !== item.groupKey ? 0.35 : 1}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Summary table */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">
                      {groupBy === "category" ? "Categoria" : groupBy === "bank" ? "Banco" : "Usuário"}
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase">Transações</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase">Total</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase">% do Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {items.map((item, index) => {
                    const isSelected = drilldown?.groupKey === item.groupKey;
                    return (
                      <tr
                        key={index}
                        onClick={() => isSelected ? closeDrilldown() : openDrilldown(item, index)}
                        className={`transition cursor-pointer ${isSelected ? "bg-brand-50 ring-1 ring-inset ring-brand-200" : "hover:bg-slate-50/50"}`}
                      >
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            <span className={`text-sm font-medium ${isSelected ? "text-brand-700" : "text-slate-800"}`}>{item.label}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-right text-sm text-slate-500">{item.count}</td>
                        <td className="px-6 py-3.5 text-right">
                          <span className={`text-sm font-semibold font-mono ${reportType === "income" ? "text-income" : "text-expense"}`}>
                            {formatCurrency(item.total)}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 bg-slate-100 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${reportType === "income" ? "bg-income" : "bg-expense"}`}
                                style={{ width: `${item.percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-slate-500 min-w-[40px] text-right">
                              {item.percentage.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-200">
                  <tr>
                    <td className="px-6 py-3 text-sm font-semibold text-slate-700">Total</td>
                    <td className="px-6 py-3 text-right text-sm font-semibold text-slate-700">
                      {items.reduce((a, i) => a + i.count, 0)}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className={`text-sm font-bold font-mono ${reportType === "income" ? "text-income" : "text-expense"}`}>
                        {formatCurrency(data?.grandTotal ?? 0)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-semibold text-slate-500">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Drill-down panel */}
            {drilldown && (
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden animate-fade-in">
                {/* Panel header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between"
                  style={{ borderLeftWidth: 4, borderLeftColor: drilldown.color, borderLeftStyle: "solid" }}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={closeDrilldown}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                      title="Voltar ao resumo"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{drilldown.label}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {drillLoading ? "Carregando..." : `${drillTxns.length} lançamento(s) · ${formatCurrency(drillTxns.reduce((a, t) => a + parseFloat(t.value), 0))}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Transactions list */}
                {drillLoading ? (
                  <div className="py-10 text-center text-slate-400 text-sm">Carregando lançamentos...</div>
                ) : drillTxns.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 text-sm">Nenhum lançamento encontrado</div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Data</th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Descrição</th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Valor</th>
                        <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Pago</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {drillTxns.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/50 transition">
                          <td className="px-6 py-3.5 text-sm text-slate-500 whitespace-nowrap">
                            {formatDate(t.effectiveDate ?? t.date)}
                          </td>
                          <td className="px-6 py-3.5">
                            <p className="text-sm font-medium text-slate-800">{t.description}</p>
                            {t.notes && <p className="text-xs text-slate-400 mt-0.5">{t.notes}</p>}
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <span className={`text-sm font-semibold font-mono ${reportType === "income" ? "text-income" : "text-expense"}`}>
                              {reportType === "income" ? "+" : "-"}{formatCurrency(t.value)}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-center">
                            {t.isPaid
                              ? <CheckCircle2 size={16} className="text-income mx-auto" />
                              : <Circle size={16} className="text-slate-300 mx-auto" />
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t border-slate-200">
                      <tr>
                        <td colSpan={2} className="px-6 py-3 text-sm font-semibold text-slate-700">Total</td>
                        <td className="px-6 py-3 text-right">
                          <span className={`text-sm font-bold font-mono ${reportType === "income" ? "text-income" : "text-expense"}`}>
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
