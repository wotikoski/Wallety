"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActiveGroup } from "@/lib/hooks/useActiveGroup";
import { formatCurrency } from "@/lib/utils/currency";

function formatCurrencyShort(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}R$ ${(abs / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (abs >= 1_000) return `${sign}R$ ${(abs / 1_000).toFixed(1).replace(".", ",")}k`;
  return formatCurrency(value);
}

function SummaryChip({
  label, value, labelColor, valueColor, bg,
}: {
  label: string; value: number; labelColor: string; valueColor: string; bg: string;
}) {
  const [tooltip, setTooltip] = useState(false);
  useEffect(() => {
    if (!tooltip) return;
    const t = setTimeout(() => setTooltip(false), 2500);
    return () => clearTimeout(t);
  }, [tooltip]);

  return (
    <div className="relative rounded-[12px] px-3 py-2.5 text-center" style={{ background: bg }}>
      <p className="text-[10px] font-bold uppercase tracking-[0.07em] mb-0.5" style={{ color: labelColor }}>{label}</p>
      {/* Mobile: abbreviated + tap-to-reveal tooltip */}
      <button
        onClick={() => setTooltip((v) => !v)}
        className="md:hidden text-sm font-semibold font-mono block w-full text-center"
        style={{ color: valueColor }}
      >
        {formatCurrencyShort(value)}
      </button>
      {tooltip && (
        <div className="md:hidden absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#0f172a] text-white text-[12px] font-mono font-semibold px-3 py-1.5 rounded-[8px] whitespace-nowrap shadow-lg z-30 pointer-events-none animate-fade-in">
          {formatCurrency(value)}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-[#0f172a]" />
        </div>
      )}
      {/* Desktop: full value, no interaction */}
      <p className="hidden md:block text-sm font-semibold font-mono" style={{ color: valueColor }}>
        {formatCurrency(value)}
      </p>
    </div>
  );
}
import { formatDate } from "@/lib/utils/date";
import { useCallback, useEffect, useRef, useState } from "react";
import { format, startOfMonth, endOfMonth, addMonths, parseISO } from "date-fns";
import Link from "next/link";
import {
  Plus, ArrowUpRight, ArrowDownRight, CheckCircle2, Circle,
  Trash2, Edit, ChevronLeft, ChevronRight, Layers, Download, Clock,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useConfirm } from "@/lib/hooks/useConfirm";
import { FilterSheet } from "./FilterSheet";
import { SwipeableRow } from "./SwipeableRow";
import { usePullToRefresh } from "@/lib/hooks/usePullToRefresh";

interface Transaction {
  id: string;
  date: string;
  effectiveDate: string | null;
  type: "income" | "expense";
  description: string;
  value: string;
  isPaid: boolean;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  bankId: string | null;
  installmentCurrent: number | null;
  installmentTotal: number | null;
  installmentGroupId: string | null;
}

type DeleteScope = "single" | "this_and_future" | "all";

// Short month labels in pt-BR for invoice chips ("Fatura mai/26").
const MONTHS_PT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
function formatInvoiceMonth(isoDate: string) {
  const [y, m] = isoDate.split("-");
  return `${MONTHS_PT[parseInt(m) - 1]}/${y.slice(2)}`;
}

export function TransactionsClient() {
  const { activeGroupId } = useActiveGroup();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const now = new Date();
  const todayStr = format(now, "yyyy-MM-dd");
  const [page, setPage] = useState(1);
  const [type, setType] = useState<string>("");
  const [startDate, setStartDate] = useState(format(startOfMonth(now), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(now), "yyyy-MM-dd"));
  const [showFuture, setShowFuture] = useState(false);

  // Pull-to-refresh: ref on the mobile card list container
  const listRef = useRef<HTMLDivElement>(null);
  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
  }, [queryClient]);
  usePullToRefresh(handleRefresh, listRef as React.RefObject<HTMLElement>);

  // Month navigation: move one month back/forward and update start+end dates.
  // endOfMonth handles short months (Feb, Apr, Jun…) automatically.
  const navigateMonth = (delta: -1 | 1) => {
    const ref = startDate ? parseISO(startDate) : now;
    const next = addMonths(ref, delta);
    setStartDate(format(startOfMonth(next), "yyyy-MM-dd"));
    setEndDate(format(endOfMonth(next), "yyyy-MM-dd"));
    setPage(1);
  };

  // Lazy-materialize recurring transactions when opening Lançamentos.
  // Throttled to once per hour per session (shared with Dashboard).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = "recurring_materialized_at";
    const last = sessionStorage.getItem(key);
    const ONE_HOUR = 60 * 60 * 1000;
    if (last && Date.now() - parseInt(last) < ONE_HOUR) return;
    sessionStorage.setItem(key, String(Date.now()));

    fetch("/api/recurring/materialize", { method: "POST" })
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (res && res.created > 0) {
          queryClient.invalidateQueries({ queryKey: ["transactions"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        }
      })
      .catch(() => { /* silent */ });
  }, [queryClient]);

  const params = new URLSearchParams({ page: String(page), limit: "30" });
  if (activeGroupId) params.set("groupId", activeGroupId);
  if (type) params.set("type", type);
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  if (!showFuture) params.set("hideFuture", "true");

  const { data, isLoading } = useQuery<{ transactions: Transaction[] }>({
    queryKey: ["transactions", page, type, startDate, endDate, activeGroupId, showFuture],
    queryFn: () => fetch(`/api/transactions?${params}`).then((r) => r.json()),
    placeholderData: (prev) => prev,
  });

  const { confirm: askConfirm, dialogProps } = useConfirm();

  const togglePaid = useMutation({
    mutationFn: async (t: Transaction) => {
      const res = await fetch(`/api/transactions/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPaid: !t.isPaid, paidAt: !t.isPaid ? new Date().toISOString() : null }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Erro ao atualizar lançamento");
      }
    },
    // Optimistic update: flip isPaid locally before the request returns,
    // so the UI feels instant. Roll back if the request fails.
    onMutate: async (t: Transaction) => {
      // Haptic feedback on mobile devices that support it
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(50);
      }
      await queryClient.cancelQueries({ queryKey: ["transactions"] });
      const previous = queryClient.getQueriesData<{ transactions: Transaction[] }>({ queryKey: ["transactions"] });
      queryClient.setQueriesData<{ transactions: Transaction[] }>(
        { queryKey: ["transactions"] },
        (old) => {
          if (!old?.transactions) return old;
          return {
            ...old,
            transactions: old.transactions.map((row) =>
              row.id === t.id ? { ...row, isPaid: !t.isPaid } : row,
            ),
          };
        },
      );
      return { previous };
    },
    onError: (err: Error, _t, ctx) => {
      // Restore previous cache state on failure.
      ctx?.previous?.forEach(([key, data]) => queryClient.setQueryData(key, data));
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
    // Toggling paid affects every derived view (dashboard pending totals,
    // daily limit, budgets, calendar). Invalidate all of them.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transactions-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["daily-limit"] });
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: async ({ id, scope }: { id: string; scope: DeleteScope }) => {
      const res = await fetch(`/api/transactions/${id}?scope=${scope}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Erro ao excluir lançamento");
      }
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transactions-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["daily-limit"] });
      toast({
        title:
          vars.scope === "all"
            ? "Todas as parcelas excluídas"
            : vars.scope === "this_and_future"
              ? "Parcela atual e futuras excluídas"
              : "Lançamento excluído",
      });
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  // State for the installment-scope dialog (shown instead of the simple
  // confirm when the transaction belongs to an installment group).
  const [installmentDelete, setInstallmentDelete] = useState<Transaction | null>(null);

  const askDelete = (t: Transaction) => {
    if (t.installmentGroupId && t.installmentTotal && t.installmentTotal > 1) {
      setInstallmentDelete(t);
      return;
    }
    askConfirm(() => deleteTransaction.mutate({ id: t.id, scope: "single" }), {
      title: "Excluir lançamento",
      description: `Tem certeza que deseja excluir "${t.description}"?`,
      confirmLabel: "Excluir",
    });
  };

  const txns = data?.transactions ?? [];
  const totalIncome = txns.filter((t) => t.type === "income").reduce((a, t) => a + parseFloat(t.value), 0);
  const totalExpense = txns.filter((t) => t.type === "expense").reduce((a, t) => a + parseFloat(t.value), 0);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold text-app-text tracking-tight">Lançamentos</h1>
          <p className="text-slate-500 text-sm mt-0.5">Gerencie todas as suas transações</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/api/transactions/export?${params}`}
            className="flex items-center gap-2 h-9 px-3.5 rounded-[10px] border-[1.5px] border-app-border text-[13px] font-semibold text-app-muted hover:bg-white hover:text-app-text transition"
            title="Baixar CSV com os filtros atuais"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Exportar CSV</span>
          </a>
          {/* FilterSheet trigger — visible only on mobile */}
          <FilterSheet
            type={type}
            setType={setType}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            showFuture={showFuture}
            setShowFuture={setShowFuture}
            navigateMonth={navigateMonth}
            setPage={setPage}
          />
          {/* "Novo Lançamento" button — hidden on mobile (FAB is used instead) */}
          <Link
            href="/lancamentos/novo"
            title="Novo Lançamento"
            className="hidden md:flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-3.5 h-9 rounded-lg transition"
          >
            <Plus size={16} />
            Novo Lançamento
          </Link>
        </div>
      </div>

      {/* FAB — mobile only, above the bottom nav */}
      <Link
        href="/lancamentos/novo"
        title="Novo Lançamento"
        className="md:hidden fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center shadow-lg transition"
        aria-label="Novo Lançamento"
      >
        <Plus size={24} />
      </Link>

      {/* Filters — desktop only (mobile uses FilterSheet) */}
      <div className="hidden md:flex flex-wrap gap-2 items-center">
        {/* Chip type filters */}
        {(["", "income", "expense"] as const).map((v) => (
          <button
            key={v}
            onClick={() => { setType(v); setPage(1); }}
            className={`chip-filter${type === v ? " active" : ""}`}
          >
            {v === "" ? "Todos" : v === "income" ? "Receitas" : "Despesas"}
          </button>
        ))}
        <div className="w-px h-5 bg-app-border mx-1" />
        {/* Date range */}
        <input
          type="date"
          value={startDate}
          onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
          className="h-9 text-[13px] border-[1.5px] border-app-border rounded-[10px] px-3 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white font-medium text-app-text"
        />
        <span className="text-app-muted text-sm">→</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
          className="h-9 text-[13px] border-[1.5px] border-app-border rounded-[10px] px-3 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white font-medium text-app-text"
        />
        {/* Month nav */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigateMonth(-1)}
            title="Mês anterior"
            className="h-9 w-9 flex items-center justify-center rounded-[10px] border-[1.5px] border-app-border text-app-muted hover:bg-white hover:text-app-text transition"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => navigateMonth(1)}
            title="Próximo mês"
            className="h-9 w-9 flex items-center justify-center rounded-[10px] border-[1.5px] border-app-border text-app-muted hover:bg-white hover:text-app-text transition"
          >
            <ChevronRight size={14} />
          </button>
        </div>
        {/* Agendados toggle */}
        <button
          onClick={() => { setShowFuture((v) => !v); setPage(1); }}
          className={`chip-filter${showFuture ? " active" : ""}`}
          title={showFuture ? "Ocultar lançamentos futuros" : "Mostrar lançamentos agendados"}
        >
          <Clock size={12} className="inline mr-1" />
          Agendados
        </button>
        {(type || startDate || endDate) && (
          <button
            onClick={() => { setType(""); setStartDate(""); setEndDate(""); setPage(1); }}
            className="text-[12px] text-app-muted hover:text-app-text px-2 transition"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Summary mini — sticky on mobile so it stays visible while scrolling */}
      {txns.length > 0 && (
        <div className="sticky top-0 z-10 py-2 bg-app-bg/95 backdrop-blur-sm md:static md:bg-transparent md:py-0 md:backdrop-blur-none">
          <div className="grid grid-cols-3 gap-2">
            <SummaryChip
              label="Receitas"
              value={totalIncome}
              labelColor="#059669"
              valueColor="#10b981"
              bg="rgba(16,185,129,.1)"
            />
            <SummaryChip
              label="Despesas"
              value={totalExpense}
              labelColor="#ef4444"
              valueColor="#f87171"
              bg="rgba(248,113,113,.1)"
            />
            <SummaryChip
              label="Saldo"
              value={totalIncome - totalExpense}
              labelColor={totalIncome - totalExpense >= 0 ? "#059669" : "#ef4444"}
              valueColor={totalIncome - totalExpense >= 0 ? "#10b981" : "#f87171"}
              bg={totalIncome - totalExpense >= 0 ? "rgba(16,185,129,.1)" : "rgba(248,113,113,.1)"}
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-[14px] border border-app-border shadow-card overflow-hidden">
        {isLoading ? (
          <ListSkeleton rows={6} />
        ) : txns.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">💳</div>
            <p className="text-slate-500 text-sm">Nenhum lançamento encontrado</p>
            <Link href="/lancamentos/novo" className="mt-3 inline-flex items-center gap-1 text-brand-600 text-sm font-medium hover:text-brand-700">
              <Plus size={14} /> Criar primeiro lançamento
            </Link>
          </div>
        ) : (
          <>
            {/* Mobile card view */}
            <div ref={listRef} className="md:hidden divide-y divide-[#f1f3f9]">
              {txns.map((t) => (
                <SwipeableRow
                  key={t.id}
                  actions={
                    <div className="flex h-full w-full">
                      <Link
                        href={`/lancamentos/${t.id}`}
                        className="flex-1 flex flex-col items-center justify-center gap-1 bg-brand-500 text-white text-xs font-medium"
                      >
                        <Edit size={16} />
                        Editar
                      </Link>
                      <button
                        onClick={() => askDelete(t)}
                        className="flex-1 flex flex-col items-center justify-center gap-1 bg-expense text-white text-xs font-medium"
                      >
                        <Trash2 size={16} />
                        Excluir
                      </button>
                    </div>
                  }
                >
                  <div className="px-4 py-3.5 flex items-center gap-3 bg-white hover:bg-[#f8f9fd] transition">
                    <div
                      className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                      style={{ background: t.type === "income" ? "rgba(16,185,129,.12)" : "rgba(248,113,113,.12)" }}
                    >
                      {t.type === "income"
                        ? <ArrowUpRight size={14} className="text-income" strokeWidth={2.5} />
                        : <ArrowDownRight size={14} className="text-expense" strokeWidth={2.5} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-app-text truncate">{t.description}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <p className="text-[11px] text-app-muted">{formatDate(t.date)}</p>
                        {t.installmentTotal && t.installmentTotal > 1 && (
                          <span className="text-[10px] text-app-muted flex items-center gap-0.5">
                            <Layers size={10} />{t.installmentCurrent}/{t.installmentTotal}
                          </span>
                        )}
                        {t.effectiveDate && t.effectiveDate !== t.date && (
                          <span className="text-[10px] font-medium text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">
                            Fatura {formatInvoiceMonth(t.effectiveDate)}
                          </span>
                        )}
                        {t.date > todayStr && (
                          <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Clock size={9} /> Agendado
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <p className={`text-[13px] font-semibold font-mono ${t.type === "income" ? "text-income" : "text-expense"}`}>
                          {t.type === "income" ? "+" : "−"}{formatCurrency(t.value)}
                        </p>
                        <span className={`text-[10px] font-semibold ${t.isPaid ? "text-income" : "text-amber-500"}`}>
                          {t.isPaid ? "✓ Pago" : "● Pendente"}
                        </span>
                      </div>
                      <button onClick={() => togglePaid.mutate(t)} className="text-app-muted hover:text-income transition">
                        {t.isPaid ? <CheckCircle2 size={16} className="text-income" /> : <Circle size={16} />}
                      </button>
                    </div>
                  </div>
                </SwipeableRow>
              ))}
            </div>

            {/* Desktop table view */}
            <table className="hidden md:table w-full">
              <thead className="bg-[#f8f9fd] border-b border-[#f1f3f9]">
                <tr>
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-app-muted uppercase tracking-[0.07em]">Data</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-app-muted uppercase tracking-[0.07em]">Descrição</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-app-muted uppercase tracking-[0.07em]">Parcela</th>
                  <th className="text-right px-5 py-3 text-[11px] font-bold text-app-muted uppercase tracking-[0.07em]">Valor</th>
                  <th className="text-center px-5 py-3 text-[11px] font-bold text-app-muted uppercase tracking-[0.07em]">Pago</th>
                  <th className="text-right px-5 py-3 text-[11px] font-bold text-app-muted uppercase tracking-[0.07em]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f3f9]">
                {txns.map((t) => (
                  <tr key={t.id} className="hover:bg-[#f8f9fd] transition">
                    <td className="px-5 py-3.5 text-[13px] text-app-muted whitespace-nowrap">
                      {formatDate(t.date)}
                      {t.effectiveDate && t.effectiveDate !== t.date && (
                        <div className="text-[10px] font-semibold text-brand-500 bg-[rgba(99,102,241,.08)] px-1.5 py-0.5 rounded-full inline-block mt-1">
                          Fatura {formatInvoiceMonth(t.effectiveDate)}
                        </div>
                      )}
                      {t.date > todayStr && (
                        <div className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 mt-1">
                          <Clock size={9} /> Agendado
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0"
                          style={{ background: t.type === "income" ? "rgba(16,185,129,.12)" : "rgba(248,113,113,.12)" }}
                        >
                          {t.type === "income"
                            ? <ArrowUpRight size={13} className="text-income" strokeWidth={2.5} />
                            : <ArrowDownRight size={13} className="text-expense" strokeWidth={2.5} />
                          }
                        </div>
                        <div>
                          <span className="text-[13px] font-semibold text-app-text">{t.description}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[11px] text-app-muted">
                      {t.installmentTotal && t.installmentTotal > 1 ? (
                        <span className="flex items-center gap-1">
                          <Layers size={11} />
                          {t.installmentCurrent}/{t.installmentTotal}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`text-[13px] font-semibold font-mono ${t.type === "income" ? "text-income" : "text-expense"}`}>
                        {t.type === "income" ? "+" : "−"}{formatCurrency(t.value)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button onClick={() => togglePaid.mutate(t)} className="text-app-muted hover:text-income transition">
                        {t.isPaid ? <CheckCircle2 size={18} className="text-income" /> : <Circle size={18} />}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/lancamentos/${t.id}`}
                          className="p-1.5 text-app-muted hover:text-brand-500 hover:bg-[rgba(99,102,241,.08)] rounded-lg transition"
                        >
                          <Edit size={14} />
                        </Link>
                        <button
                          onClick={() => askDelete(t)}
                          className="p-1.5 text-app-muted hover:text-expense hover:bg-[rgba(248,113,113,.1)] rounded-lg transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {txns.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#f1f3f9]">
            <span className="text-[12px] text-app-muted">{txns.length} lançamentos</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-1.5 text-app-muted hover:text-app-text disabled:opacity-30 transition rounded-lg hover:bg-[#f1f3f9]"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="text-[12px] text-app-muted font-medium px-1">Página {page}</span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={txns.length < 30}
                className="p-1.5 text-app-muted hover:text-app-text disabled:opacity-30 transition rounded-lg hover:bg-[#f1f3f9]"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog {...dialogProps} loading={deleteTransaction.isPending} />

      {installmentDelete && (
        <InstallmentDeleteDialog
          transaction={installmentDelete}
          loading={deleteTransaction.isPending}
          onCancel={() => setInstallmentDelete(null)}
          onConfirm={(scope) => {
            const id = installmentDelete.id;
            setInstallmentDelete(null);
            deleteTransaction.mutate({ id, scope });
          }}
        />
      )}
    </div>
  );
}

// Scope picker for installment deletion: "only this", "this and future",
// or "all installments". Mirrors the backend DELETE ?scope= contract.
function InstallmentDeleteDialog({
  transaction,
  loading,
  onConfirm,
  onCancel,
}: {
  transaction: Transaction;
  loading: boolean;
  onConfirm: (scope: DeleteScope) => void;
  onCancel: () => void;
}) {
  const [scope, setScope] = useState<DeleteScope>("single");
  const total = transaction.installmentTotal ?? 0;
  const current = transaction.installmentCurrent ?? 0;
  const remaining = Math.max(0, total - current + 1);

  const options: { value: DeleteScope; label: string; hint: string }[] = [
    {
      value: "single",
      label: `Somente esta parcela (${current}/${total})`,
      hint: "As outras parcelas continuam ativas.",
    },
    {
      value: "this_and_future",
      label: `Esta e as próximas (${remaining} parcelas)`,
      hint: "Mantém as parcelas já passadas.",
    },
    {
      value: "all",
      label: `Todas as ${total} parcelas`,
      hint: "Remove o lançamento inteiro, incluindo as já pagas.",
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-fade-in"
      onClick={() => !loading && onCancel()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white rounded-[14px] shadow-card w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-base font-semibold text-slate-900">Excluir parcelamento</h2>
          <p className="text-sm text-slate-500 mt-1">
            &quot;{transaction.description}&quot; faz parte de um parcelamento de {total} parcelas. O que você quer excluir?
          </p>
          <div className="mt-4 space-y-2">
            {options.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                  scope === opt.value
                    ? "border-brand-500 bg-brand-50"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="delete-scope"
                  value={opt.value}
                  checked={scope === opt.value}
                  onChange={() => setScope(opt.value)}
                  className="mt-1 accent-brand-600"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{opt.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{opt.hint}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(scope)}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-expense hover:bg-expense-dark rounded-lg transition disabled:opacity-50"
          >
            {loading ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </div>
    </div>
  );
}
