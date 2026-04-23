"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Filter, X, TrendingUp, TrendingDown } from "lucide-react";

interface ReportFilterSheetProps {
  reportType: "income" | "expense";
  setReportType: (v: "income" | "expense") => void;
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  groupBy: "category" | "bank" | "user";
  setGroupBy: (v: "category" | "bank" | "user") => void;
  navigateMonth: (delta: -1 | 1) => void;
  activeGroupId: string | null;
  onFilterChange: (fn: () => void) => void;
}

export function ReportFilterSheet({
  reportType,
  setReportType,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  groupBy,
  setGroupBy,
  navigateMonth,
  activeGroupId,
  onFilterChange,
}: ReportFilterSheetProps) {
  const [open, setOpen] = useState(false);

  const [draftType, setDraftType] = useState(reportType);
  const [draftStart, setDraftStart] = useState(startDate);
  const [draftEnd, setDraftEnd] = useState(endDate);
  const [draftGroupBy, setDraftGroupBy] = useState(groupBy);

  const openSheet = () => {
    setDraftType(reportType);
    setDraftStart(startDate);
    setDraftEnd(endDate);
    setDraftGroupBy(groupBy);
    setOpen(true);
  };

  const apply = () => {
    onFilterChange(() => {
      setReportType(draftType);
      setStartDate(draftStart);
      setEndDate(draftEnd);
      setGroupBy(draftGroupBy);
    });
    setOpen(false);
  };

  const hasActiveFilters = startDate || endDate || groupBy !== "category" || reportType !== "expense";

  return (
    <>
      {/* Trigger button — mobile only */}
      <button
        onClick={openSheet}
        className={`md:hidden relative flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border transition ${
          hasActiveFilters
            ? "border-brand-400 bg-brand-50 text-brand-600 font-medium"
            : "border-slate-200 text-slate-500 bg-white hover:bg-slate-50"
        }`}
        aria-label="Filtros"
      >
        <Filter size={15} />
        Filtros
        {hasActiveFilters && (
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-brand-600" />
        )}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-up sheet */}
      <div
        className={`md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Filtros</h2>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Tipo de relatório */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Tipo de relatório</label>
            <div className="flex rounded-xl border border-slate-200 overflow-hidden h-[42px]">
              <button
                onClick={() => setDraftType("income")}
                className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium transition ${
                  draftType === "income" ? "bg-income text-white" : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <TrendingUp size={14} /> Receitas
              </button>
              <button
                onClick={() => setDraftType("expense")}
                className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium transition ${
                  draftType === "expense" ? "bg-expense text-white" : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <TrendingDown size={14} /> Despesas
              </button>
            </div>
          </div>

          {/* Agrupar por */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Agrupar por</label>
            <select
              value={draftGroupBy}
              onChange={(e) => setDraftGroupBy(e.target.value as "category" | "bank" | "user")}
              className="w-full h-[42px] text-sm border border-slate-200 rounded-xl px-3 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="category">Categoria</option>
              <option value="bank">Banco</option>
              {activeGroupId && <option value="user">Usuário</option>}
            </select>
          </div>

          {/* Navegação de mês */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Navegar mês</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { navigateMonth(-1); setOpen(false); }}
                className="flex-1 flex items-center justify-center gap-1 h-[42px] border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition"
              >
                <ChevronLeft size={16} /> Anterior
              </button>
              <button
                onClick={() => { navigateMonth(1); setOpen(false); }}
                className="flex-1 flex items-center justify-center gap-1 h-[42px] border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition"
              >
                Próximo <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Data inicial */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Data inicial</label>
            <input
              type="date"
              value={draftStart}
              onChange={(e) => setDraftStart(e.target.value)}
              className="w-full h-[42px] text-sm border border-slate-200 rounded-xl px-3 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            />
          </div>

          {/* Data final */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Data final</label>
            <input
              type="date"
              value={draftEnd}
              onChange={(e) => setDraftEnd(e.target.value)}
              className="w-full h-[42px] text-sm border border-slate-200 rounded-xl px-3 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-slate-100 pb-safe">
          <button
            onClick={() => {
              setDraftType("expense");
              setDraftGroupBy("category");
              setDraftStart("");
              setDraftEnd("");
            }}
            className="flex-1 h-[44px] text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
          >
            Limpar
          </button>
          <button
            onClick={apply}
            className="flex-1 h-[44px] text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition"
          >
            Aplicar
          </button>
        </div>
      </div>
    </>
  );
}
