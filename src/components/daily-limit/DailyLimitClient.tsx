"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActiveGroup } from "@/lib/hooks/useActiveGroup";
import { formatCurrency } from "@/lib/utils/currency";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import { Target, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

interface DailyLimitData {
  plannedIncome: number;
  plannedFixedExpenses: number;
  remaining: number;
  daysInMonth: number;
  daysRemaining: number;
  dailyLimit: number;
  adjustedDailyLimit: number;
  spentVariable: number;
  remainingReal: number;
}

export function DailyLimitClient() {
  const { activeGroupId } = useActiveGroup();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const params = new URLSearchParams({ month: String(month), year: String(year) });
  if (activeGroupId) params.set("groupId", activeGroupId);

  const { data, isLoading } = useQuery<DailyLimitData & { budget: { plannedIncome: string; plannedFixedExpenses: string } | null }>({
    queryKey: ["daily-limit", month, year, activeGroupId],
    queryFn: () => fetch(`/api/daily-limit?${params}`).then((r) => r.json()),
  });

  const { register, handleSubmit } = useForm({
    values: {
      plannedIncome: data?.budget ? parseFloat(data.budget.plannedIncome) : 0,
      plannedFixedExpenses: data?.budget ? parseFloat(data.budget.plannedFixedExpenses) : 0,
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: { plannedIncome: number; plannedFixedExpenses: number }) => {
      await fetch("/api/daily-limit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, month, year, groupId: activeGroupId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-limit"] });
      toast({ title: "Orçamento atualizado!" });
    },
  });

  const dailyLimit = data?.dailyLimit ?? 0;
  const adjustedDailyLimit = data?.adjustedDailyLimit ?? 0;
  const isOverBudget = adjustedDailyLimit <= 0;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Limite Diário</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Descubra quanto você pode gastar por dia com base na sua renda e despesas fixas
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

      {/* Result Card */}
      <div className={`rounded-2xl p-8 text-white ${isOverBudget ? "bg-expense" : "bg-brand-600"}`}>
        <div className="flex items-center gap-3 mb-4">
          {isOverBudget
            ? <AlertTriangle size={24} className="opacity-80" />
            : <Target size={24} className="opacity-80" />
          }
          <span className="text-base font-medium opacity-80">
            {isOverBudget ? "Orçamento estourado" : "Limite diário atual"}
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
        <StatCard label="Renda Planejada" value={data?.plannedIncome ?? 0} color="income" />
        <StatCard label="Gastos Fixos" value={data?.plannedFixedExpenses ?? 0} color="expense" />
        <StatCard label="Disponível" value={data?.remaining ?? 0} color={data?.remaining ?? 0 >= 0 ? "income" : "expense"} />
        <StatCard label="Já gastei (variável)" value={data?.spentVariable ?? 0} color="neutral" />
      </div>

      {/* Formula explanation */}
      <div className="bg-slate-50 rounded-xl p-5 space-y-2">
        <h3 className="text-sm font-semibold text-slate-700">Como é calculado</h3>
        <div className="text-sm text-slate-500 space-y-1.5">
          <div className="flex justify-between">
            <span>Renda planejada</span>
            <span className="font-mono text-income">{formatCurrency(data?.plannedIncome ?? 0)}</span>
          </div>
          <div className="flex justify-between">
            <span>(-) Gastos fixos</span>
            <span className="font-mono text-expense">{formatCurrency(data?.plannedFixedExpenses ?? 0)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-1.5">
            <span>= Disponível no mês</span>
            <span className="font-mono font-semibold">{formatCurrency(data?.remaining ?? 0)}</span>
          </div>
          <div className="flex justify-between">
            <span>(-) Já gasto (variável)</span>
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

      {/* Budget form */}
      <form
        onSubmit={handleSubmit((d) => saveMutation.mutate({ plannedIncome: Number(d.plannedIncome), plannedFixedExpenses: Number(d.plannedFixedExpenses) }))}
        className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm space-y-4"
      >
        <h2 className="text-base font-semibold text-slate-800">Configurar orçamento do mês</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Renda planejada (R$)</label>
            <input
              {...register("plannedIncome", { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Gastos fixos (R$)</label>
            <input
              {...register("plannedFixedExpenses", { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
            />
          </div>
        </div>
        <p className="text-xs text-slate-400">
          Os gastos marcados como "custo fixo" nos lançamentos são somados automaticamente.
        </p>
        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition disabled:opacity-50"
        >
          {saveMutation.isPending ? "Salvando..." : "Salvar orçamento"}
        </button>
      </form>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: "income" | "expense" | "neutral" }) {
  const colorClasses = {
    income: "text-income-dark bg-income-light",
    expense: "text-expense-dark bg-expense-light",
    neutral: "text-slate-700 bg-slate-100",
  };
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-base font-bold font-mono ${colorClasses[color]?.split(" ")[0]}`}>
        {formatCurrency(value)}
      </p>
    </div>
  );
}
