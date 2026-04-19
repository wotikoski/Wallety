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

  const transactions = data?.transactions ?? [];

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Calendário</h1>
          <p className="text-slate-500 text-sm mt-0.5">Visualize seus lançamentos por data</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-2 rounded-lg hover:bg-slate-100 transition"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-semibold text-slate-800 min-w-[140px] text-center">
            {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR }).replace(/^\w/, c => c.toUpperCase())}
          </span>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-2 rounded-lg hover:bg-slate-100 transition"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-slate-100">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-slate-400 py-3">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="h-14 md:h-24 border-b border-r border-slate-50" />
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
                  className={`h-14 md:h-24 border-b border-r border-slate-50 p-1 md:p-2 text-left transition hover:bg-slate-50 ${isSelected ? "bg-brand-50 ring-1 ring-inset ring-brand-300" : ""}`}
                >
                  <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-medium mb-1 ${today ? "bg-brand-600 text-white" : "text-slate-600"}`}>
                    {format(day, "d")}
                  </span>
                  <div className="space-y-0.5 hidden md:block">
                    {incomes.length > 0 && (
                      <div className="text-xs text-income truncate">
                        +{formatCurrency(incomes.reduce((a, t) => a + parseFloat(t.value), 0))}
                      </div>
                    )}
                    {expenses.length > 0 && (
                      <div className="text-xs text-expense truncate">
                        -{formatCurrency(expenses.reduce((a, t) => a + parseFloat(t.value), 0))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-0.5 md:hidden">
                    {incomes.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-income" />}
                    {expenses.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-expense" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Day Detail Panel */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          {selectedDay ? (
            <>
              <h2 className="text-base font-semibold text-slate-800 mb-1">
                {format(selectedDay, "dd 'de' MMMM", { locale: ptBR })}
              </h2>
              <p className="text-xs text-slate-400 mb-4">{selectedTxns.length} lançamento(s)</p>
              {selectedTxns.length === 0 ? (
                <p className="text-sm text-slate-400">Nenhum lançamento neste dia</p>
              ) : (
                <div className="space-y-2">
                  {selectedTxns.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800 truncate">{t.description}</p>
                        <span className={`text-xs ${t.isPaid ? "text-income" : "text-slate-400"}`}>
                          {t.isPaid ? "Pago" : "Pendente"}
                        </span>
                      </div>
                      <span className={`text-sm font-semibold font-mono ml-2 ${t.type === "income" ? "text-income" : "text-expense"}`}>
                        {t.type === "income" ? "+" : "-"}{formatCurrency(t.value)}
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-slate-100 flex justify-between text-sm font-semibold">
                    <span className="text-slate-600">Saldo do dia</span>
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
            <div className="h-full flex items-center justify-center text-slate-400 text-sm py-12">
              Clique em um dia para ver os lançamentos
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
