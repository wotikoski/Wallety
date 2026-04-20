"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActiveGroup } from "@/lib/hooks/useActiveGroup";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import { useState } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import Link from "next/link";
import {
  Plus, Filter, ArrowUpRight, ArrowDownRight, CheckCircle2, Circle,
  Trash2, Edit, ChevronLeft, ChevronRight, Layers,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Transaction {
  id: string;
  date: string;
  type: "income" | "expense";
  description: string;
  value: string;
  isPaid: boolean;
  categoryId: string | null;
  bankId: string | null;
  installmentCurrent: number | null;
  installmentTotal: number | null;
}

export function TransactionsClient() {
  const { activeGroupId } = useActiveGroup();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const now = new Date();
  const [page, setPage] = useState(1);
  const [type, setType] = useState<string>("");
  const [startDate, setStartDate] = useState(format(startOfMonth(now), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(now), "yyyy-MM-dd"));

  const params = new URLSearchParams({ page: String(page), limit: "30" });
  if (activeGroupId) params.set("groupId", activeGroupId);
  if (type) params.set("type", type);
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);

  const { data, isLoading } = useQuery<{ transactions: Transaction[] }>({
    queryKey: ["transactions", page, type, startDate, endDate, activeGroupId],
    queryFn: () => fetch(`/api/transactions?${params}`).then((r) => r.json()),
  });

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transactions"] }),
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast({ title: "Lançamento excluído" });
    },
  });

  const txns = data?.transactions ?? [];
  const totalIncome = txns.filter((t) => t.type === "income").reduce((a, t) => a + parseFloat(t.value), 0);
  const totalExpense = txns.filter((t) => t.type === "expense").reduce((a, t) => a + parseFloat(t.value), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Lançamentos</h1>
          <p className="text-slate-500 text-sm mt-0.5">Gerencie todas as suas transações</p>
        </div>
        <Link
          href="/lancamentos/novo"
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
        >
          <Plus size={16} />
          Novo Lançamento
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex flex-wrap gap-3 items-end">
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
        {(type || startDate || endDate) && (
          <button
            onClick={() => { setType(""); setStartDate(""); setEndDate(""); setPage(1); }}
            className="h-[38px] text-sm text-slate-500 hover:text-slate-700 px-3 rounded-lg hover:bg-slate-50 transition"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Summary mini */}
      {txns.length > 0 && (
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
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Carregando...</div>
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
            <div className="md:hidden divide-y divide-slate-50">
              {txns.map((t) => (
                <div key={t.id} className="px-4 py-3.5 flex items-center gap-3">
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
                    <div className="flex flex-col gap-1">
                      <button onClick={() => togglePaid.mutate(t)} className="text-slate-400 hover:text-income transition">
                        {t.isPaid ? <CheckCircle2 size={16} className="text-income" /> : <Circle size={16} />}
                      </button>
                      <Link href={`/lancamentos/${t.id}`} className="text-slate-400 hover:text-brand-600 transition">
                        <Edit size={14} />
                      </Link>
                      <button
                        onClick={() => { if (confirm("Confirma a exclusão?")) deleteTransaction.mutate(t.id); }}
                        className="text-slate-400 hover:text-expense transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
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
                    <td className="px-6 py-3.5 text-sm text-slate-500 whitespace-nowrap">{formatDate(t.date)}</td>
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
                          onClick={() => { if (confirm("Confirma a exclusão?")) deleteTransaction.mutate(t.id); }}
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
    </div>
  );
}
