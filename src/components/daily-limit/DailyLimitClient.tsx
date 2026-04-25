"use client";

import { useQuery } from "@tanstack/react-query";
import { useActiveGroup } from "@/lib/hooks/useActiveGroup";
import { formatCurrency } from "@/lib/utils/currency";
import { useState } from "react";
import { CalendarClock, Info } from "lucide-react";
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
  const hasReserve = (data?.reserveNeeded ?? 0) > 0;
  const isOverBudget = (data?.adjustedAvailable ?? 0) <= 0;
  const nextMonthName = MONTHS[month % 12];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold text-app-text tracking-tight">Limite Diário</h1>
          <p className="text-app-muted text-[13px] mt-0.5 font-medium">
            Quanto você pode gastar por dia, considerando compromissos do próximo mês
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="text-[13px] font-semibold border-[1.5px] border-app-border rounded-[10px] px-3 h-9 bg-white text-app-text focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="text-[13px] font-semibold border-[1.5px] border-app-border rounded-[10px] px-3 h-9 bg-white text-app-text focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {[2023, 2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-app-muted py-12 text-sm">Calculando...</div>
      ) : (
        <>
          {/* Hero card */}
          <div
            className="rounded-[14px] p-5 text-white"
            style={{ background: isOverBudget ? "#f87171" : "#6366f1" }}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.07em] text-white/80 mb-1.5">
              {isOverBudget ? "Saldo insuficiente" : "Limite diário"}
            </p>
            <p className="text-[28px] font-bold font-mono text-white mb-1">
              {formatCurrency(adjustedDailyLimit)}
            </p>
            <p className="text-[12px] text-white/70">
              por dia · {data?.daysRemaining ?? 0} dias restantes
            </p>
            {hasReserve && (
              <div className="mt-3 pt-3 border-t border-[#2B284F] flex items-center gap-2 text-[12px] text-white/80">
                <CalendarClock size={13} />
                <span>Inclui reserva de {formatCurrency(data?.reserveNeeded ?? 0)} para {nextMonthName}</span>
              </div>
            )}
          </div>

          {/* Next month alert */}
          {hasReserve && (
            <div className="bg-amber-50 border border-amber-200 rounded-[14px] p-4">
              <div className="flex gap-3">
                <CalendarClock size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] font-semibold text-amber-800">
                    Déficit previsto em {nextMonthName}: {formatCurrency(data?.nextMonthDeficit ?? 0)}
                  </p>
                  <p className="text-[12px] text-amber-700 mt-0.5">
                    Receitas lançadas: {formatCurrency(data?.nextMonthIncome ?? 0)} · Despesas lançadas: {formatCurrency(data?.nextMonthExpenses ?? 0)}
                  </p>
                  <p className="text-[12px] text-amber-600 mt-1">
                    Este valor já está sendo reservado do seu limite atual.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Receitas" value={data?.actualIncome ?? 0} color="income" />
            <StatCard label="Despesas fixas" value={data?.actualFixedExpenses ?? 0} color="expense" />
            <StatCard label="Gastos variáveis" value={data?.spentVariable ?? 0} color="expense" />
            <StatCard label="Reserva p/ próx. mês" value={data?.reserveNeeded ?? 0} color={hasReserve ? "warning" : "neutral"} />
          </div>

          {/* Breakdown */}
          <div className="bg-white rounded-[14px] border border-app-border shadow-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Info size={14} className="text-app-muted" />
              <h3 className="text-[13px] font-semibold text-app-text">Como é calculado</h3>
            </div>
            <div className="text-[13px] text-app-muted space-y-2">
              <Row label="Receitas do mês" value={data?.actualIncome ?? 0} type="income" />
              <Row label="(-) Despesas fixas" value={data?.actualFixedExpenses ?? 0} type="expense" />
              <Row label="(-) Gastos variáveis" value={data?.spentVariable ?? 0} type="expense" />
              <div className="flex justify-between border-t border-app-border pt-2 font-semibold text-app-text">
                <span>= Saldo restante</span>
                <span className="font-mono">{formatCurrency(data?.remainingReal ?? 0)}</span>
              </div>
              {hasReserve && (
                <Row label={`(-) Reserva para ${nextMonthName}`} value={data?.reserveNeeded ?? 0} type="expense" />
              )}
              <div className="flex justify-between border-t border-app-border pt-2 font-semibold text-app-text">
                <span>= Disponível para gastar</span>
                <span className="font-mono">{formatCurrency(data?.adjustedAvailable ?? 0)}</span>
              </div>
              <div className="flex justify-between pt-1 font-semibold text-brand-500">
                <span>÷ {data?.daysRemaining ?? 0} dias restantes</span>
                <span className="font-mono">{formatCurrency(adjustedDailyLimit)} / dia</span>
              </div>
            </div>
          </div>

          {(data?.actualIncome ?? 0) === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-[14px] p-4 text-[13px] text-blue-700">
              Nenhuma receita lançada para {MONTHS[month - 1]} de {year}. Adicione receitas em <strong>Lançamentos</strong> para calcular seu limite diário.
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
    income: "text-income",
    expense: "text-expense",
    warning: "text-amber-600",
    neutral: "text-app-muted",
  };
  return (
    <div className="bg-white rounded-[14px] border border-app-border shadow-card p-4">
      <p className="text-[11px] font-bold text-app-muted uppercase tracking-[0.07em] mb-1.5">{label}</p>
      <p className={`text-[16px] font-bold font-mono ${colors[color]}`}>
        {formatCurrency(value)}
      </p>
    </div>
  );
}
