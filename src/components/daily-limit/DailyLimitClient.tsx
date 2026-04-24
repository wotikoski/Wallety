"use client";

import { useQuery } from "@tanstack/react-query";
import { useActiveGroup } from "@/lib/hooks/useActiveGroup";
import { formatCurrency } from "@/lib/utils/currency";
import { useState } from "react";
import { Target, AlertTriangle, CalendarClock, Info } from "lucide-react";
import type { DailyLimitResult } from "@/lib/utils/daily-limit";

const MONTHS = ["Janeiro", "Fevereiro", "MarÃ§o", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

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
  const hasReserve = (data?.reserveNeeded ?? 0) > 0;
  const isOverBudget = (data?.adjustedAvailable ?? 0) <= 0;
  const nextMonthName = MONTHS[month % 12];

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-[22px] font-extrabold text-app-text tracking-tight">Limite DiÃ¡rio</h1>
        <p className="text-app-muted text-[13px] mt-0.5 font-medium">
          Quanto vocÃª pode gastar por dia, considerando compromissos do prÃ³ximo mÃªs
        </p>
      </div>

      {/* Month selector */}
      <div className="flex items-center gap-2">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="h-9 text-sm border border-slate-200 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="h-9 text-sm border border-slate-200 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="text-center text-slate-400 py-12">Calculando...</div>
      ) : (
        <>
          {/* Main result card */}
          <div className={`rounded-[14px] p-8 text-white ${isOverBudget ? "bg-expense" : "bg-brand-600"}`}>
            <div className="flex items-center gap-3 mb-4">
              {isOverBudget
                ? <AlertTriangle size={24} className="opacity-80" />
                : <Target size={24} className="opacity-80" />
              }
              <span className="text-base font-medium opacity-80">
                {isOverBudget ? "Saldo insuficiente" : "Limite diÃ¡rio real"}
              </span>
            </div>
            <p className="text-5xl font-bold font-mono mb-2">
              {formatCurrency(adjustedDailyLimit)}
            </p>
            <p className="text-sm opacity-70">
              por dia Â· {data?.daysRemaining ?? 0} dias restantes
            </p>
            {hasReserve && (
              <div className="mt-4 pt-4 border-t border-white/20 flex items-center gap-2 text-sm opacity-80">
                <CalendarClock size={15} />
                <span>Inclui reserva de {formatCurrency(data?.reserveNeeded ?? 0)} para {nextMonthName}</span>
              </div>
            )}
          </div>

          {/* Next month alert */}
          {hasReserve && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex gap-3">
                <CalendarClock size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">
                    DÃ©ficit previsto em {nextMonthName}: {formatCurrency(data?.nextMonthDeficit ?? 0)}
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Receitas lanÃ§adas: {formatCurrency(data?.nextMonthIncome ?? 0)} Â· Despesas lanÃ§adas: {formatCurrency(data?.nextMonthExpenses ?? 0)}
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Este valor jÃ¡ estÃ¡ sendo reservado do seu limite atual.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Receitas" value={data?.actualIncome ?? 0} color="income" />
            <StatCard label="Despesas fixas" value={data?.actualFixedExpenses ?? 0} color="expense" />
            <StatCard label="Gastos variÃ¡veis" value={data?.spentVariable ?? 0} color="expense" />
            <StatCard label="Reserva p/ prÃ³x. mÃªs" value={data?.reserveNeeded ?? 0} color={hasReserve ? "warning" : "neutral"} />
          </div>

          {/* Breakdown */}
          <div className="bg-slate-50 rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <Info size={14} className="text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-700">Como Ã© calculado</h3>
            </div>
            <div className="text-sm text-slate-500 space-y-1.5">
              <Row label="Receitas do mÃªs" value={data?.actualIncome ?? 0} type="income" />
              <Row label="(-) Despesas fixas" value={data?.actualFixedExpenses ?? 0} type="expense" />
              <Row label="(-) Gastos variÃ¡veis" value={data?.spentVariable ?? 0} type="expense" />
              <div className="flex justify-between border-t border-slate-200 pt-1.5 font-medium text-slate-700">
                <span>= Saldo restante</span>
                <span className="font-mono">{formatCurrency(data?.remainingReal ?? 0)}</span>
              </div>
              {hasReserve && (
                <Row label={`(-) Reserva para ${nextMonthName}`} value={data?.reserveNeeded ?? 0} type="expense" />
              )}
              <div className="flex justify-between border-t border-slate-200 pt-1.5 font-semibold text-slate-800">
                <span>= DisponÃ­vel para gastar</span>
                <span className="font-mono">{formatCurrency(data?.adjustedAvailable ?? 0)}</span>
              </div>
              <div className="flex justify-between pt-1 text-brand-600 font-semibold">
                <span>Ã· {data?.daysRemaining ?? 0} dias restantes</span>
                <span className="font-mono">{formatCurrency(adjustedDailyLimit)} / dia</span>
              </div>
            </div>
          </div>

          {(data?.actualIncome ?? 0) === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
              Nenhuma receita lanÃ§ada para {MONTHS[month - 1]} de {year}. Adicione receitas em <strong>LanÃ§amentos</strong> para calcular seu limite diÃ¡rio.
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Row({ label, value, type }: { label: string; value: number; type: "income" | "expense" }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className={`font-mono ${type === "income" ? "text-income" : "text-expense"}`}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: "income" | "expense" | "warning" | "neutral" }) {
  const colors = {
    income: "text-income-dark",
    expense: "text-expense-dark",
    warning: "text-amber-700",
    neutral: "text-slate-400",
  };
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-base font-bold font-mono ${colors[color]}`}>
        {formatCurrency(value)}
      </p>
    </div>
  );
}
