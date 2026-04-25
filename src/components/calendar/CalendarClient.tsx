"use client";

import { useQuery } from "@tanstack/react-query";
import { useActiveGroup } from "@/lib/hooks/useActiveGroup";
import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";

interface Transaction {
  id: string;
  date: string;
  type: "income" | "expense";
  description: string;
  value: string;
  isPaid: boolean;
  notes?: string | null;
  projected?: boolean;
}

interface ProjectedOccurrence {
  ruleId: string;
  date: string;
  type: string;
  description: string;
  value: string;
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function CalendarClient() {
  const { activeGroupId } = useActiveGroup();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const start = format(startOfMonth(currentDate), "yyyy-MM-dd");
  const end = format(endOfMonth(currentDate), "yyyy-MM-dd");

  const params = new URLSearchParams({ startDate: start, endDate: end, limit: "500" });
  if (activeGroupId) params.set("groupId", activeGroupId);

  const { data } = useQuery<{ transactions: Transaction[] }>({
    queryKey: ["transactions-calendar", start, end, activeGroupId],
    queryFn: () => fetch(`/api/transactions?${params}`).then((r) => r.json()),
  });

  const projParams = new URLSearchParams({ from: start, to: end });
  if (activeGroupId) projParams.set("groupId", activeGroupId);

  const { data: projData } = useQuery<{ projected: ProjectedOccurrence[] }>({
    queryKey: ["recurring-projected-calendar", start, end, activeGroupId],
    queryFn: () => fetch(`/api/recurring/projected?${projParams}`).then((r) => r.json()),
  });

  // Merge real transactions with projected occurrences. Projected rows are
  // flagged so the UI can render them with a distinct (dashed) style and
  // they never mix with "Pago/Pendente" semantics.
  const projectedAsTxns: Transaction[] = (projData?.projected ?? []).map((p) => ({
    id: `proj-${p.ruleId}-${p.date}`,
    date: p.date,
    type: p.type as "income" | "expense",
    description: p.description,
    value: p.value,
    isPaid: false,
    projected: true,
  }));
  const transactions = [...(data?.transactions ?? []), ...projectedAsTxns];

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const firstDayOffset = getDay(startOfMonth(currentDate));

  function getTxnsForDay(day: Date) {
    return transactions.filter((t) => isSameDay(parseISO(t.date), day));
  }

  const selectedTxns = selectedDay ? getTxnsForDay(selectedDay) : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold text-app-text tracking-tight">Calendário</h1>
          <p className="text-app-muted text-[13px] mt-0.5 font-medium">Visualize seus lançamentos por data</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="h-9 w-9 flex items-center justify-center rounded-[10px] border-[1.5px] border-app-border text-app-muted hover:bg-[var(--surface-raised)] hover:text-app-text transition"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-[13px] font-semibold text-app-text px-3 whitespace-nowrap">
            {format(currentDate, "MMMM yyyy", { locale: ptBR }).replace(/^\w/, c => c.toUpperCase())}
          </span>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="h-9 w-9 flex items-center justify-center rounded-[10px] border-[1.5px] border-app-border text-app-muted hover:bg-[var(--surface-raised)] hover:text-app-text transition"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-white rounded-[14px] border border-app-border shadow-card overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-app-border">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-app-muted py-3">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="h-14 md:h-24 border-b border-r border-app-border" />
            ))}
            {days.map((day) => {
              const dayTxns = getTxnsForDay(day);
              const incomes = dayTxns.filter((t) => t.type === "income");
              const expenses = dayTxns.filter((t) => t.type === "expense");
              const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
              const today = isToday(day);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`h-14 md:h-24 border-b border-r border-app-border p-1 md:p-2 text-left transition hover:bg-[var(--surface-raised)] ${isSelected ? "bg-brand-50 ring-1 ring-inset ring-brand-500" : ""}`}
                >
                  <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-medium mb-1 ${today ? "bg-brand-600 text-white" : "text-app-muted"}`}>
                    {format(day, "d")}
                  </span>
                  <div className="space-y-0.5 hidden md:block">
                    {incomes.length > 0 && (
                      <div className={`text-xs truncate ${incomes.every((t) => t.projected) ? "text-income/60 italic" : "text-income"}`}>
                        +{formatCurrency(incomes.reduce((a, t) => a + parseFloat(t.value), 0))}
                      </div>
                    )}
                    {expenses.length > 0 && (
                      <div className={`text-xs truncate ${expenses.every((t) => t.projected) ? "text-expense/60 italic" : "text-expense"}`}>
                        -{formatCurrency(expenses.reduce((a, t) => a + parseFloat(t.value), 0))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-0.5 md:hidden">
                    {incomes.length > 0 && (
                      <div className={`w-1.5 h-1.5 rounded-full ${incomes.every((t) => t.projected) ? "bg-income/50" : "bg-income"}`} />
                    )}
                    {expenses.length > 0 && (
                      <div className={`w-1.5 h-1.5 rounded-full ${expenses.every((t) => t.projected) ? "bg-expense/50" : "bg-expense"}`} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Day Detail Panel */}
        <div className="bg-white rounded-[14px] border border-app-border shadow-card p-5">
          {selectedDay ? (
            <>
              <h2 className="text-base font-semibold text-app-text mb-1">
                {format(selectedDay, "dd 'de' MMMM", { locale: ptBR })}
              </h2>
              <p className="text-xs text-[#706DA0] dark:text-[#B0BAC9] mb-4">{selectedTxns.length} lançamento(s)</p>
              {selectedTxns.length === 0 ? (
                <p className="text-sm text-[#706DA0] dark:text-[#B0BAC9]">Nenhum lançamento neste dia</p>
              ) : (
                <div className="space-y-2">
                  {selectedTxns.map((t) => (
                    <div
                      key={t.id}
                      className={`flex items-center justify-between p-2.5 rounded-lg ${
                        t.projected
                          ? "bg-white border border-dashed border-app-border"
                          : "bg-[var(--surface-raised)]"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium truncate ${t.projected ? "text-app-muted italic" : "text-app-text"}`}>
                          {t.description}
                        </p>
                        {t.notes && (
                          <p className="text-xs text-[#706DA0] dark:text-[#B0BAC9] truncate mt-0.5">{t.notes}</p>
                        )}
                        <span className={`text-xs ${t.projected ? "text-[#706DA0] dark:text-[#B0BAC9]" : t.isPaid ? "text-income" : "text-[#706DA0] dark:text-[#B0BAC9]"}`}>
                          {t.projected ? "Previsto" : t.isPaid ? "Pago" : "Pendente"}
                        </span>
                      </div>
                      <span className={`text-sm font-semibold font-mono ml-2 ${
                        t.projected
                          ? t.type === "income" ? "text-income/60" : "text-expense/60"
                          : t.type === "income" ? "text-income" : "text-expense"
                      }`}>
                        {t.type === "income" ? "+" : "-"}{formatCurrency(t.value)}
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-app-border flex justify-between text-sm font-semibold">
                    <span className="text-app-text">Saldo do dia</span>
                    <span className={`font-mono ${
                      selectedTxns.reduce((a, t) => t.type === "income" ? a + parseFloat(t.value) : a - parseFloat(t.value), 0) >= 0
                        ? "text-income" : "text-expense"
                    }`}>
                      {formatCurrency(
                        selectedTxns.reduce((a, t) => t.type === "income" ? a + parseFloat(t.value) : a - parseFloat(t.value), 0)
                      )}
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-[#706DA0] dark:text-[#B0BAC9] text-sm py-12">
              Clique em um dia para ver os lançamentos
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
