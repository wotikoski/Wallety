"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActiveGroup } from "@/lib/hooks/useActiveGroup";
import { formatCurrency, parseCurrency } from "@/lib/utils/currency";
import { useToast } from "@/components/ui/use-toast";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useConfirm } from "@/lib/hooks/useConfirm";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Plus, RefreshCcw, Trash2, Play, Edit, CheckCircle2, Circle, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from "lucide-react";
import { useState, useEffect } from "react";
import { SwipeableRow } from "@/components/transactions/SwipeableRow";

// "2026-02-17" → "17/02/2026"
function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

interface Category {
  id: string;
  name: string;
  type: string;
  color: string | null;
  icon: string | null;
}

interface Bank {
  id: string;
  name: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
}

interface Recurring {
  id: string;
  type: "income" | "expense";
  description: string;
  value: string;
  categoryId: string | null;
  bankId: string | null;
  paymentMethodId: string | null;
  frequency: "monthly" | "weekly" | "yearly";
  dayOfMonth: string | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  lastGeneratedDate: string | null;
  notes: string | null;
}

const FREQ_LABEL: Record<string, string> = {
  monthly: "Mensal",
  weekly: "Semanal",
  yearly: "Anual",
};

function fmtShort(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}R$ ${(abs / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (abs >= 1_000) return `${sign}R$ ${(abs / 1_000).toFixed(1).replace(".", ",")}k`;
  return formatCurrency(value);
}

function CommittedCard({ value }: { value: number }) {
  const [tooltip, setTooltip] = useState(false);
  useEffect(() => {
    if (!tooltip) return;
    const t = setTimeout(() => setTooltip(false), 2500);
    return () => clearTimeout(t);
  }, [tooltip]);

  return (
    <div className="bg-white rounded-[14px] border border-app-border shadow-card p-3">
      <p className="text-[10px] font-bold text-app-muted uppercase tracking-[0.06em] mb-1.5 leading-tight">
        Comprometido<span className="hidden md:inline normal-case font-medium">/mês</span>
      </p>
      {/* Mobile: abbreviated + tap-to-reveal tooltip */}
      <div className="relative md:hidden">
        <button
          onClick={() => setTooltip((v) => !v)}
          className="text-[15px] font-bold font-mono leading-tight text-expense text-left"
        >
          {fmtShort(value)}
        </button>
        {tooltip && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#0f172a] text-white text-[12px] font-mono font-semibold px-3 py-1.5 rounded-[8px] whitespace-nowrap shadow-lg z-30 pointer-events-none animate-fade-in">
            {formatCurrency(value)}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-[#0f172a]" />
          </div>
        )}
      </div>
      {/* Desktop: full value, no interaction */}
      <p className="hidden md:block text-[15px] font-bold font-mono leading-tight text-expense">
        {formatCurrency(value)}
      </p>
    </div>
  );
}

export function RecurringClient() {
  const { activeGroupId } = useActiveGroup();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { confirm, dialogProps } = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<Recurring | null>(null);

  const params = new URLSearchParams();
  if (activeGroupId) params.set("groupId", activeGroupId);

  const { data, isLoading } = useQuery<{ recurring: Recurring[] }>({
    queryKey: ["recurring", activeGroupId],
    queryFn: () => fetch(`/api/recurring?${params}`).then((r) => r.json()),
  });

  const { data: catsData } = useQuery<{ categories: Category[] }>({
    queryKey: ["categories", "all", activeGroupId],
    queryFn: () => fetch(`/api/categories?${params}`).then((r) => r.json()),
  });

  const { data: banksData } = useQuery<{ banks: Bank[] }>({
    queryKey: ["banks", activeGroupId],
    queryFn: () => fetch(`/api/banks?${params}`).then((r) => r.json()),
  });

  const { data: pmsData } = useQuery<{ paymentMethods: PaymentMethod[] }>({
    queryKey: ["payment-methods", activeGroupId],
    queryFn: () => fetch(`/api/payment-methods?${params}`).then((r) => r.json()),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/recurring/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao remover");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["recurring-projected"] });
      queryClient.invalidateQueries({ queryKey: ["report"] });
      toast({ title: "Recorrência e lançamentos removidos" });
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async (v: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/recurring/${v.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: v.isActive }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recurring"] }),
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const materializeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/recurring/materialize`, { method: "POST" });
      if (!res.ok) throw new Error("Erro ao gerar lançamentos");
      return res.json() as Promise<{ created: number }>;
    },
    onSuccess: (d) => {
      queryClient.invalidateQueries({ queryKey: ["recurring"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({ title: d.created > 0 ? `${d.created} lançamento(s) gerado(s)` : "Nada pendente" });
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const rows = data?.recurring ?? [];
  const categories = catsData?.categories ?? [];
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const banks = banksData?.banks ?? [];
  const paymentMethods = pmsData?.paymentMethods ?? [];

  function openNew() {
    setEditingRule(null);
    setShowForm(true);
  }

  function openEdit(r: Recurring) {
    setEditingRule(r);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingRule(null);
  }

  const active = rows.filter((r) => r.isActive);
  const inactive = rows.filter((r) => !r.isActive);
  // r.value comes from the DB as a plain decimal string ("1500.00"), so use
  // parseFloat directly — parseCurrency strips the decimal point and gives wrong results.
  const monthlyCommitted = active
    .filter((r) => r.type === "expense" && r.frequency === "monthly")
    .reduce((s, r) => s + parseFloat(r.value), 0);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold text-app-text tracking-tight">Recorrências</h1>
          <p className="text-app-muted text-[13px] mt-0.5 font-medium">Receitas e despesas automáticas</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => materializeMutation.mutate()}
            disabled={materializeMutation.isPending}
            title="Gerar pendentes"
            className="flex items-center gap-2 h-9 px-3.5 rounded-lg border border-app-border text-sm font-medium text-app-muted hover:bg-[var(--surface-raised)] hover:text-app-text transition disabled:opacity-60"
          >
            <Play size={14} />
            <span className="hidden sm:inline">
              {materializeMutation.isPending ? "Gerando..." : "Gerar Pendentes"}
            </span>
          </button>
          <button
            onClick={openNew}
            title="Nova recorrência"
            className="hidden sm:flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-3.5 h-9 rounded-lg transition"
          >
            <Plus size={14} />
            Nova Recorrência
          </button>
        </div>
      </div>

      {/* Stats */}
      {rows.length > 0 && (
        <div className="grid grid-cols-3 gap-2.5">
          {/* Comprometido — abbreviated on mobile + tooltip */}
          <CommittedCard value={monthlyCommitted} />
          {[
            { label: "Ativas", value: String(active.length), color: "text-app-text" },
            { label: "Pausadas", value: String(inactive.length), color: "text-app-muted" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-[14px] border border-app-border shadow-card p-3">
              <p className="text-[10px] font-bold text-app-muted uppercase tracking-[0.06em] mb-1.5 leading-tight">{s.label}</p>
              <p className={`text-[15px] font-bold font-mono leading-tight ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-[14px] border border-app-border shadow-card overflow-hidden">
        {isLoading ? (
          <ListSkeleton rows={4} />
        ) : rows.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">🔁</div>
            <p className="text-app-muted text-sm">Nenhuma recorrência cadastrada</p>
            <button onClick={openNew} className="mt-3 inline-flex items-center gap-1 text-brand-500 text-sm font-semibold hover:text-brand-700">
              <Plus size={14} /> Criar primeira recorrência
            </button>
          </div>
        ) : (
          <>
            {/* Mobile card view */}
            <div className="md:hidden divide-y divide-[#f1f3f9]">
              {rows.map((r) => {
                const cat = r.categoryId ? catMap.get(r.categoryId) : null;
                return (
                  <SwipeableRow
                    key={r.id}
                    actions={
                      <div className="flex h-full w-full">
                        <button
                          onClick={() => openEdit(r)}
                          className="flex-1 flex flex-col items-center justify-center gap-1 bg-brand-500 text-white text-xs font-medium"
                        >
                          <Edit size={16} />
                          Editar
                        </button>
                        <button
                          onClick={() => confirm(() => deleteMutation.mutate(r.id), { title: "Remover recorrência?", description: "A regra e todos os lançamentos gerados por ela serão removidos.", variant: "danger" })}
                          className="flex-1 flex flex-col items-center justify-center gap-1 bg-expense text-white text-xs font-medium"
                        >
                          <Trash2 size={16} />
                          Excluir
                        </button>
                      </div>
                    }
                  >
                    <div className={`px-4 py-3.5 flex items-center gap-3 bg-white transition ${!r.isActive ? "opacity-60" : ""}`}>
                      <div
                        className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                        style={{ background: r.type === "income" ? "rgba(16,185,129,.12)" : "rgba(248,113,113,.12)" }}
                      >
                        {r.type === "income"
                          ? <ArrowUpRight size={14} className="text-income" strokeWidth={2.5} />
                          : <ArrowDownRight size={14} className="text-expense" strokeWidth={2.5} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-app-text truncate">{r.description}</p>
                        <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 mt-0.5">
                          <span className="text-[11px] text-app-muted whitespace-nowrap">
                            {FREQ_LABEL[r.frequency]}
                            {r.frequency === "monthly" && r.dayOfMonth && ` · dia ${r.dayOfMonth === "last" ? "último" : r.dayOfMonth}`}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <div className="text-right">
                          <p className={`text-[13px] font-semibold font-mono whitespace-nowrap ${r.type === "income" ? "text-income" : "text-expense"}`}>
                            {r.type === "income" ? "+" : "−"}{formatCurrency(r.value)}
                          </p>
                          <span className={`text-[10px] font-semibold ${r.isActive ? "text-income" : "text-app-muted"}`}>
                            {r.isActive ? "Ativa" : "Pausada"}
                          </span>
                        </div>
                        <button
                          onClick={() => toggleMutation.mutate({ id: r.id, isActive: !r.isActive })}
                          className="text-app-muted hover:text-income transition"
                        >
                          {r.isActive ? <CheckCircle2 size={18} className="text-income" /> : <Circle size={18} />}
                        </button>
                      </div>
                    </div>
                  </SwipeableRow>
                );
              })}
            </div>

            {/* Desktop table view */}
            <table className="hidden md:table w-full">
              <thead className="bg-[#f8f9fd] border-b border-[#f1f3f9]">
                <tr>
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-app-muted uppercase tracking-[0.07em]">Descrição</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-app-muted uppercase tracking-[0.07em]">Frequência</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-app-muted uppercase tracking-[0.07em]">Início</th>
                  <th className="text-right px-5 py-3 text-[11px] font-bold text-app-muted uppercase tracking-[0.07em]">Valor</th>
                  <th className="text-center px-5 py-3 text-[11px] font-bold text-app-muted uppercase tracking-[0.07em]">Ativa</th>
                  <th className="text-right px-5 py-3 text-[11px] font-bold text-app-muted uppercase tracking-[0.07em]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f3f9]">
                {rows.map((r) => {
                  const cat = r.categoryId ? catMap.get(r.categoryId) : null;
                  return (
                    <tr key={r.id} className={`hover:bg-[#f8f9fd] transition ${!r.isActive ? "opacity-60" : ""}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0"
                            style={{ background: r.type === "income" ? "rgba(16,185,129,.12)" : "rgba(248,113,113,.12)" }}
                          >
                            {r.type === "income"
                              ? <ArrowUpRight size={13} className="text-income" strokeWidth={2.5} />
                              : <ArrowDownRight size={13} className="text-expense" strokeWidth={2.5} />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-app-text truncate">{r.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[13px] text-app-muted whitespace-nowrap">
                        {FREQ_LABEL[r.frequency]}
                        {r.frequency === "monthly" && r.dayOfMonth && (
                          <span className="text-app-muted"> · dia {r.dayOfMonth === "last" ? "último" : r.dayOfMonth}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-[13px] text-app-muted whitespace-nowrap">
                        {fmtDate(r.startDate)}
                        {r.endDate && <p className="text-[11px] text-app-muted">até {fmtDate(r.endDate)}</p>}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={`text-[13px] font-semibold font-mono ${r.type === "income" ? "text-income" : "text-expense"}`}>
                          {r.type === "income" ? "+" : "−"}{formatCurrency(r.value)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button onClick={() => toggleMutation.mutate({ id: r.id, isActive: !r.isActive })} className="text-app-muted hover:text-income transition">
                          {r.isActive ? <CheckCircle2 size={18} className="text-income" /> : <Circle size={18} />}
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(r)}
                            className="p-1.5 text-app-muted hover:text-brand-500 hover:bg-[rgba(99,102,241,.08)] rounded-lg transition"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => confirm(() => deleteMutation.mutate(r.id), { title: "Remover recorrência?", description: "A regra e todos os lançamentos gerados por ela serão removidos.", variant: "danger" })}
                            className="p-1.5 text-app-muted hover:text-expense hover:bg-[rgba(248,113,113,.1)] rounded-lg transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
      </div>

      {showForm && (
        <RecurringForm
          categories={categories}
          banks={banks}
          paymentMethods={paymentMethods}
          groupId={activeGroupId ?? null}
          editing={editingRule}
          onClose={closeForm}
          onSaved={(wasEditing) => {
            closeForm();
            // Always clear the session throttle so Reports re-materializes on
            // the next visit and picks up any template changes immediately.
            if (typeof window !== "undefined") {
              sessionStorage.removeItem("recurring_materialized_at");
            }
            queryClient.invalidateQueries({ queryKey: ["recurring"] });
            queryClient.invalidateQueries({ queryKey: ["recurring-projected"] });
            queryClient.invalidateQueries({ queryKey: ["recurring-projected-budgets"] });
            queryClient.invalidateQueries({ queryKey: ["recurring-projected-calendar"] });
            queryClient.invalidateQueries({ queryKey: ["report"] });
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            toast({ title: wasEditing ? "Recorrência atualizada!" : "Recorrência criada!" });
            // Always materialize: for new rules this creates transactions for the
            // first time; for edits the PATCH already soft-deleted the old
            // transactions and reset lastGeneratedDate, so this re-creates them
            // with the updated fields immediately instead of waiting for Reports.
            materializeMutation.mutate();
          }}
          onError={(msg) => toast({ title: "Erro", description: msg, variant: "destructive" })}
        />
      )}

      <ConfirmDialog {...dialogProps} />

      {/* FAB — mobile only, above the bottom nav */}
      <button
        onClick={openNew}
        title="Nova recorrência"
        aria-label="Nova recorrência"
        className="md:hidden fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center shadow-[0_4px_20px_rgba(99,102,241,.4)] transition"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}

function RecurringForm({
  categories,
  banks,
  paymentMethods,
  groupId,
  editing,
  onClose,
  onSaved,
  onError,
}: {
  categories: Category[];
  banks: Bank[];
  paymentMethods: PaymentMethod[];
  groupId: string | null;
  editing: Recurring | null;
  onClose: () => void;
  onSaved: (wasEditing: boolean) => void;
  onError: (msg: string) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [type, setType] = useState<"income" | "expense">(editing?.type ?? "expense");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [valueStr, setValueStr] = useState(
    editing ? String(parseFloat(editing.value)).replace(".", ",") : "",
  );
  const [categoryId, setCategoryId] = useState<string>(editing?.categoryId ?? "");
  const [bankId, setBankId] = useState<string>(editing?.bankId ?? "");
  const [paymentMethodId, setPaymentMethodId] = useState<string>(editing?.paymentMethodId ?? "");
  const [notes, setNotes] = useState<string>(editing?.notes ?? "");
  const [frequency, setFrequency] = useState<"monthly" | "weekly" | "yearly">(
    editing?.frequency ?? "monthly",
  );
  const [dayOfMonth, setDayOfMonth] = useState<string>(
    editing?.dayOfMonth ?? String(new Date().getDate()),
  );
  const [startDate, setStartDate] = useState(editing?.startDate ?? today);
  // When startDate changes on a NEW rule (not editing), sync dayOfMonth to the
  // chosen day so the user doesn't have to update two fields manually.
  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (!editing && val) {
      const day = parseInt(val.split("-")[2], 10);
      if (!isNaN(day)) setDayOfMonth(String(day));
    }
  };
  const [endDate, setEndDate] = useState(editing?.endDate ?? "");
  const [saving, setSaving] = useState(false);

  const filteredCats = categories.filter((c) => c.type === type || c.type === "both");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseCurrency(valueStr);
    if (!description.trim() || !value || value <= 0) {
      onError("Preencha descrição e valor");
      return;
    }
    setSaving(true);
    try {
      const url = editing ? `/api/recurring/${editing.id}` : "/api/recurring";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          description: description.trim(),
          value,
          categoryId: categoryId || null,
          bankId: bankId || null,
          paymentMethodId: paymentMethodId || null,
          frequency,
          dayOfMonth: frequency === "monthly" ? dayOfMonth : null,
          startDate,
          endDate: endDate || null,
          notes: notes.trim() || null,
          groupId: groupId ?? undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erro ao salvar");
      }
      onSaved(!!editing);
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--surface-card)] rounded-[14px] shadow-card w-full max-w-md p-6 space-y-4"
      >
        <h2 className="text-lg font-semibold text-app-text">
          {editing ? "Editar Recorrência" : "Nova Recorrência"}
        </h2>

        <div className="flex rounded-xl border border-app-border overflow-hidden h-[42px]">
          <button
            type="button"
            onClick={() => setType("income")}
            className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium transition ${
              type === "income" ? "bg-income text-white" : "text-app-muted hover:bg-[var(--surface-raised)]"
            }`}
          >
            <TrendingUp size={14} /> Receita
          </button>
          <button
            type="button"
            onClick={() => setType("expense")}
            className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium transition ${
              type === "expense" ? "bg-expense text-white" : "text-app-muted hover:bg-[var(--surface-raised)]"
            }`}
          >
            <TrendingDown size={14} /> Despesa
          </button>
        </div>

        <div>
          <label className="block text-xs font-medium text-app-muted mb-1">Descrição</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full h-9 px-3 text-sm border border-app-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-[var(--surface-card)] text-app-text"
            placeholder="Ex: Aluguel"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-app-muted mb-1">Valor</label>
            <input
              type="text"
              inputMode="decimal"
              value={valueStr}
              onChange={(e) => setValueStr(e.target.value)}
              className="w-full h-9 px-3 text-sm font-mono border border-app-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-[var(--surface-card)] text-app-text"
              placeholder="0,00"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-app-muted mb-1">Categoria</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-9 px-3 text-sm border border-app-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-[var(--surface-card)] text-app-text"
            >
              <option value="">Sem categoria</option>
              {filteredCats.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.icon ? ` ${c.icon}` : ""}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-app-muted mb-1">Banco</label>
            <select
              value={bankId}
              onChange={(e) => setBankId(e.target.value)}
              className="w-full h-9 px-3 text-sm border border-app-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-[var(--surface-card)] text-app-text"
            >
              <option value="">Sem banco</option>
              {banks.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-app-muted mb-1">Forma de Pagamento</label>
            <select
              value={paymentMethodId}
              onChange={(e) => setPaymentMethodId(e.target.value)}
              className="w-full h-9 px-3 text-sm border border-app-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-[var(--surface-card)] text-app-text"
            >
              <option value="">Selecionar...</option>
              {paymentMethods.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-app-muted mb-1">Frequência</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as "monthly" | "weekly" | "yearly")}
              className="w-full h-9 px-3 text-sm border border-app-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-[var(--surface-card)] text-app-text"
            >
              <option value="monthly">Mensal</option>
              <option value="weekly">Semanal</option>
              <option value="yearly">Anual</option>
            </select>
          </div>
          {frequency === "monthly" && (
            <div>
              <label className="block text-xs font-medium text-app-muted mb-1">Dia do mês</label>
              <select
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
                className="w-full h-9 px-3 text-sm border border-app-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-[var(--surface-card)] text-app-text"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={String(d)}>
                    {d}
                  </option>
                ))}
                <option value="last">Último</option>
              </select>
              {(parseInt(dayOfMonth) >= 29 || dayOfMonth === "last") && (
                <p className="text-[10px] text-app-muted mt-1">
                  Em meses com menos dias, usa o último dia do mês.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-app-muted mb-1">Início</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="w-full h-9 px-3 text-sm border border-app-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-[var(--surface-card)] text-app-text"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-app-muted mb-1">Fim (opcional)</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full h-9 px-3 text-sm border border-app-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-[var(--surface-card)] text-app-text"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-app-muted mb-1">Notas (opcional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Alguma observação..."
            className="w-full px-3 py-2 text-sm border border-app-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-[var(--surface-card)] text-app-text resize-none"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-9 px-4 rounded-lg border border-app-border text-sm font-medium text-app-muted hover:bg-[var(--surface-raised)] hover:text-app-text transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 h-9 px-4 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? "Salvando..." : editing ? "Atualizar" : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
