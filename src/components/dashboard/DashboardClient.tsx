"use client";

import { useQuery } from "@tanstack/react-query";
import { useActiveGroup } from "@/lib/hooks/useActiveGroup";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import { useState } from "react";
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
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const params = new URLSearchParams({ month: String(month), year: String(year) });
  if (activeGroupId) params.set("groupId", activeGroupId);

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard", month, year, activeGroupId],
    queryFn: () => fetch(`/api/dashboard?${params}`).then((r) => r.json()),
  });

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
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Visão geral das suas finanças</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="flex-1 sm:flex-none text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {[2023, 2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          label="Receitas"
          value={totalIncome}
          icon={<TrendingUp size={20} />}
          color="income"
        />
        <SummaryCard
          label="Despesas"
          value={totalExpenses}
          icon={<TrendingDown size={20} />}
          color="expense"
        />
        <SummaryCard
          label="Saldo"
          value={balance}
          icon={<Wallet size={20} />}
          color={balance >= 0 ? "income" : "expense"}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Receitas vs Despesas (6 meses)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.monthlyTrend ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="income" name="Receitas" fill="#16a34a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Despesas" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Expenses by Category */}
        <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Despesas por Categoria</h2>
          {(data?.expensesByCategory?.length ?? 0) > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={data?.expensesByCategory ?? []}
                  dataKey="total"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {(data?.expensesByCategory ?? []).map((entry, index) => (
                    <Cell key={index} fill={entry.color || `hsl(${index * 37}, 70%, 50%)`} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend iconSize={10} iconType="circle" formatter={(v) => <span className="text-xs text-slate-600">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-52 text-slate-400 text-sm">
              Nenhuma despesa no período
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-50">
          <h2 className="text-base font-semibold text-slate-800">Lançamentos Recentes</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {(data?.recentTransactions ?? []).length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              Nenhum lançamento no período
            </div>
          ) : (
            (data?.recentTransactions ?? []).map((t) => (
              <div key={t.id} className="flex items-center px-6 py-3.5 gap-4 hover:bg-slate-50/50 transition">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${t.type === "income" ? "bg-income-light" : "bg-expense-light"}`}>
                  {t.type === "income"
                    ? <ArrowUpRight size={14} className="text-income" />
                    : <ArrowDownRight size={14} className="text-expense" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{t.description}</p>
                  <p className="text-xs text-slate-400">{formatDate(t.date)}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold font-mono ${t.type === "income" ? "text-income" : "text-expense"}`}>
                    {t.type === "income" ? "+" : "-"}{formatCurrency(t.value)}
                  </p>
                  <span className={`text-xs ${t.isPaid ? "text-income" : "text-slate-400"}`}>
                    {t.isPaid ? "Pago" : "Pendente"}
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
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: "income" | "expense";
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-slate-500 font-medium">{label}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color === "income" ? "bg-income-light text-income" : "bg-expense-light text-expense"}`}>
          {icon}
        </div>
      </div>
      <p className={`text-2xl font-bold font-mono ${color === "income" ? "text-income-dark" : "text-expense-dark"}`}>
        {formatCurrency(value)}
      </p>
    </div>
  );
}
