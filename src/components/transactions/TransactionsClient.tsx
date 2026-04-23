"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActiveGroup } from "@/lib/hooks/useActiveGroup";
import { formatCurrency } from "@/lib/utils/currency";
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
    <div className="space-y-6 animate-fade-in pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Lançamentos</h1>
          <p className="text-slate-500 text-sm mt-0.5">Gerencie todas as suas transações</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/api/transactions/export?${params}`}
            className="flex items-center gap-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium px-3.5 py-2.5 rounded-lg transition"
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
            className="hidden md:flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
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
      <div className="hidden md:flex bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Tipo</label>
          <select
            value={type}
            onChange={(e) => { setType(e.target.value); setPage(1); }}
            className="h-[38px] text-sm border border-slate-200 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="">Todos</option>
            <option value="income">Receitas</option>
            <option value="expense">Despesas</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Data inicial</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="w-[155px] h-[38px] text-sm border border-slate-200 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Data final</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="w-[155px] h-[38px] text-sm border border-slate-200 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          />
        </div>
        {/* Month shortcuts */}
        <div className="flex items-center gap-1 h-[38px]">
          <button
            onClick={() => navigateMonth(-1)}
            title="Mês anterior"
            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={() => navigateMonth(1)}
            title="Próximo mês"
            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
          >
            <ChevronRight size={15} />
          </button>
        </div>
        {/* Toggle: mostrar lançamentos agendados (data > hoje) */}
        <button
          onClick={() => { setShowFuture((v) => !v); setPage(1); }}
          className={`h-[38px] flex items-center gap-1.5 text-sm px-3 rounded-lg border transition ${
            showFuture
              ? "border-brand-400 bg-brand-50 text-brand-600 font-medium"
              : "border-slate-200 text-slate-500 hover:bg-slate-50"
          }`}
          title={showFuture ? "Ocultar lançamentos futuros" : "Mostrar lançamentos agendados"}
        >
          <Clock size={14} />
          <span className="hidden sm:inline">Agendados</span>
        </button>
        {(type || startDate || endDate) && (
          <button
            onClick={() => { setType(""); setStartDate(""); setEndDate(""); setPage(1); }}
            className="h-[38px] text-sm text-slate-500 hover:text-slate-700 px-3 rounded-lg hover:bg-slate-50 transition"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Summary mini — sticky on mobile so it stays visible while scrolling */}
      {txns.length > 0 && (
        <div className="sticky top-0 z-10 pt-1 pb-2 bg-white/95 backdrop-blur-sm md:static md:bg-transparent md:pt-0 md:pb-0 md:backdrop-blur-none">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-income-light rounded-xl p-3 text-center">
              <p className="text-xs text-income-dark font-medium mb-0.5">Receitas</p>
              <p className="text-base font-bold font-mono text-income-dark">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="bg-expense-light rounded-xl p-3 text-center">
              <p className="text-xs text-expense-dark font-medium mb-0.5">Despesas</p>
              <p className="text-base font-bold font-mono text-expense-dark">{formatCurrency(totalExpense)}</p>
            </div>
            <div className={`rounded-xl p-3 text-center ${totalIncome - totalExpense >= 0 ? "bg-income-light" : "bg-expense-light"}`}>
              <p className="text-xs font-medium mb-0.5 text-slate-600">Saldo</p>
              <p className={`text-base font-bold font-mono ${totalIncome - totalExpense >= 0 ? "text-income-dark" : "text-expense-dark"}`}>
                {formatCurrency(totalIncome - totalExpense)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
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
            <div ref={listRef} className="md:hidden divide-y divide-slate-50">
              {txns.map((t) => (
                <SwipeableRow
                  key={t.id}
                  actions={
                    <div className="flex h-full w-full">
                      <Link
                        href={`/lancamentos/${t.id}`}
                        className="flex-1 flex flex-col items-center justify-center gap-1 bg-brand-600 text-white text-xs font-medium"
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
                  <div className="px-4 py-3.5 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${t.type === "income" ? "bg-income-light" : "bg-expense-light"}`}>
                      {t.type === "income"
                        ? <ArrowUpRight size={14} className="text-income" />
                        : <ArrowDownRight size={14} className="text-expense" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{t.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-slate-400">{formatDate(t.date)}</p>
                        {t.installmentTotal && t.installmentTotal > 1 && (
                          <span className="text-xs text-slate-400 flex items-center gap-0.5">
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
                        <p className={`text-sm font-semibold font-mono ${t.type === "income" ? "text-income" : "text-expense"}`}>
                          {t.type === "income" ? "+" : "-"}{formatCurrency(t.value)}
                        </p>
                        <span className={`text-xs ${t.isPaid ? "text-income" : "text-slate-400"}`}>
                          {t.isPaid ? "Pago" : "Pendente"}
                        </span>
                      </div>
                      <button onClick={() => togglePaid.mutate(t)} className="text-slate-400 hover:text-income transition">
                        {t.isPaid ? <CheckCircle2 size={16} className="text-income" /> : <Circle size={16} />}
                      </button>
                    </div>
                  </div>
                </SwipeableRow>
              ))}
            </div>

            {/* Desktop table view */}
            <table className="hidden md:table w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Data</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Descrição</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Parcela</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Valor</th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Pago</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {txns.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-3.5 text-sm text-slate-500 whitespace-nowrap">
                      {formatDate(t.date)}
                      {t.effectiveDate && t.effectiveDate !== t.date && (
                        <div className="text-[10px] font-medium text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded inline-block mt-1">
                          Fatura {formatInvoiceMonth(t.effectiveDate)}
                        </div>
                      )}
                      {t.date > todayStr && (
                        <div className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded inline-flex items-center gap-0.5 mt-1">
                          <Clock size={9} /> Agendado
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${t.type === "income" ? "bg-income-light" : "bg-expense-light"}`}>
                          {t.type === "income"
                            ? <ArrowUpRight size={12} className="text-income" />
                            : <ArrowDownRight size={12} className="text-expense" />
                          }
                        </div>
                        <span className="text-sm font-medium text-slate-800">{t.description}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-slate-400">
                      {t.installmentTotal && t.installmentTotal > 1 ? (
                        <span className="flex items-center gap-1">
                          <Layers size={12} />
                          {t.installmentCurrent}/{t.installmentTotal}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span className={`text-sm font-semibold font-mono ${t.type === "income" ? "text-income" : "text-expense"}`}>
                        {t.type === "income" ? "+" : "-"}{formatCurrency(t.value)}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <button onClick={() => togglePaid.mutate(t)} className="text-slate-400 hover:text-income transition">
                        {t.isPaid ? <CheckCircle2 size={18} className="text-income" /> : <Circle size={18} />}
                      </button>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/lancamentos/${t.id}`} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition">
                          <Edit size={14} />
                        </Link>
                        <button
                          onClick={() => askDelete(t)}
                          className="p-1.5 text-slate-400 hover:text-expense hover:bg-expense-light rounded-lg transition"
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
          <div className="flex items-center justify-between px-6 py-3 border-t border-slate-50">
            <span className="text-xs text-slate-400">{txns.length} lançamentos</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 transition"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-slate-500">Página {page}</span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={txns.length < 30}
                className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 transition"
              >
                <ChevronRight size={16} />
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
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
