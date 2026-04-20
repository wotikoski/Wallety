"use client";

import { useQuery } from "@tanstack/react-query";
import { useActiveGroup } from "@/lib/hooks/useActiveGroup";
import { formatCurrency } from "@/lib/utils/currency";
import { useState } from "react";
import { Target, AlertTriangle } from "lucide-react";
import type { DailyLimitResult } from "@/lib/utils/daily-limit";

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export function DailyLimitClient() {
  const { activeGroupId } = useActiveGroup();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const params = new URLSearchParams({ month: String(month), year: String(year) });
  if (activeGroupId) params.set("groupId", activeGroupId);

  const { data, isLoading } = useQuery<DailyLimitResult>({
    queryKey: ["daily-limit", month, year, activeGroupId],
    queryFn: () => fetch(`/api/daily-limit?${params}`).then((r) => r.json()),
  });

  const adjustedDailyLimit = data?.adjustedDailyLimit ?? 0;
  const isOverBudget = (data?.remainingReal ?? 0) < 0;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Limite Diário</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Quanto você pode gastar por dia com base nas receitas e despesas reais do mês
        </p>
      </div>

      {/* Month selector */}
      <div className="flex items-center gap-2">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="text-center text-slate-400 py-12">Calculando...</div>
      ) : (
        <>
          {/* Result Card */}
          <div className={`rounded-2xl p-8 text-white ${isOverBudget ? "bg-expense" : "bg-brand-600"}`}>
            <div className="flex items-center gap-3 mb-4">
              {isOverBudget
                ? <AlertTriangle size={24} className="opacity-80" />
                : <Target size={24} className="opacity-80" />
              }
              <span className="text-base font-medium opacity-80">
                {isOverBudget ? "Saldo negativo no mês" : "Limite diário disponível"}
              </span>
            </div>
            <p className="text-5xl font-bold font-mono mb-2">
              {formatCurrency(adjustedDailyLimit)}
            </p>
            <p className="text-sm opacity-70">
              por dia · {data?.daysRemaining ?? 0} dias restantes no mês
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Receitas do mês" value={data?.plannedIncome ?? 0} color="income" />
            <StatCard label="Despesas fixas" value={data?.plannedFixedExpenses ?? 0} color="expense" />
            <StatCard label="Disponível" value={data?.remaining ?? 0} color={(data?.remaining ?? 0) >= 0 ? "income" : "expense"} />
            <StatCard label="Variável gasto" value={data?.spentVariable ?? 0} color="neutral" />
          </div>

          {/* Formula */}
          <div className="bg-slate-50 rounded-xl p-5 space-y-2">
            <h3 className="text-sm font-semibold text-slate-700">Como é calculado</h3>
            <div className="text-sm text-slate-500 space-y-1.5">
              <div className="flex justify-between">
                <span>Receitas do mês</span>
                <span className="font-mono text-income">{formatCurrency(data?.plannedIncome ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>(-) Despesas fixas</span>
                <span className="font-mono text-expense">{formatCurrency(data?.plannedFixedExpenses ?? 0)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5">
                <span>= Disponível no mês</span>
                <span className="font-mono font-semibold">{formatCurrency(data?.remaining ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>(-) Gastos variáveis</span>
                <span className="font-mono text-expense">{formatCurrency(data?.spentVariable ?? 0)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5">
                <span>= Saldo restante</span>
                <span className="font-mono font-semibold">{formatCurrency(data?.remainingReal ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>÷ {data?.daysRemaining ?? 0} dias restantes</span>
                <span className="font-mono font-semibold text-brand-600">{formatCurrency(adjustedDailyLimit)} / dia</span>
              </div>
            </div>
          </div>

          {(data?.plannedIncome ?? 0) === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
              Nenhuma receita lançada para {MONTHS[month - 1]} de {year}. Adicione receitas em <strong>Lançamentos</strong> para calcular seu limite diário.
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: "income" | "expense" | "neutral" }) {
  const colorClasses = {
    income: "text-income-dark",
    expense: "text-expense-dark",
    neutral: "text-slate-700",
  };
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-base font-bold font-mono ${colorClasses[color]}`}>
        {formatCurrency(value)}
      </p>
    </div>
  );
}
