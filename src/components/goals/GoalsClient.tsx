"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActiveGroup } from "@/lib/hooks/useActiveGroup";
import { formatCurrency, parseCurrency } from "@/lib/utils/currency";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Portal } from "@/components/ui/Portal";
import { useConfirm } from "@/lib/hooks/useConfirm";
import { COLOR_PALETTE, ColorPicker, suggestPaletteColor, rotatePaletteColor } from "@/components/ui/ColorPicker";
import {
  Plus,
  Trash2,
  Edit,
  Target,
  X,
  CalendarDays,
  TrendingUp,
  PiggyBank,
  CheckCircle2,
} from "lucide-react";
import { differenceInCalendarDays, differenceInCalendarMonths, format, parseISO, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Goal {
  id: string;
  name: string;
  targetAmount: string;
  targetDate: string;
  savedAmount: string;
  color: string;
  emoji: string;
  notes: string | null;
}

const EMOJI_OPTIONS = ["🎯", "✈️", "🏠", "🚗", "📱", "💻", "🎓", "💍", "🏋️", "🎉", "🌴", "🛍️", "🏖️", "🎸", "📷", "⛵", "🏔️", "🎁"];

function computeGoalStats(goal: Goal) {
  const target = parseFloat(goal.targetAmount);
  const saved = parseFloat(goal.savedAmount);
  const remaining = Math.max(0, target - saved);
  const percent = target > 0 ? Math.min(100, (saved / target) * 100) : 0;
  const done = saved >= target;

  const today = new Date();
  const deadline = parseISO(goal.targetDate);
  const daysLeft = differenceInCalendarDays(deadline, today);
  // months left: fractional, for monthly calculation
  const monthsLeft = differenceInCalendarMonths(deadline, today) + 1; // at least 1

  const monthlyNeeded = remaining > 0 && monthsLeft > 0 ? remaining / monthsLeft : 0;
  const dailyNeeded = remaining > 0 && daysLeft > 0 ? remaining / daysLeft : 0;
  const overdue = !done && isPast(deadline);

  return { target, saved, remaining, percent, done, daysLeft, monthsLeft, monthlyNeeded, dailyNeeded, overdue };
}

function GoalCard({
  goal,
  onEdit,
  onDeposit,
  onDelete,
}: {
  goal: Goal;
  onEdit: (g: Goal) => void;
  onDeposit: (g: Goal) => void;
  onDelete: (id: string) => void;
}) {
  const { target, saved, remaining, percent, done, daysLeft, monthlyNeeded, dailyNeeded, overdue } = computeGoalStats(goal);

  const deadlineLabel = format(parseISO(goal.targetDate), "dd/MM/yyyy");

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
      {/* Color bar */}
      <div className="h-1.5" style={{ backgroundColor: goal.color }} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl leading-none">{goal.emoji}</span>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base leading-tight">{goal.name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <CalendarDays size={11} className="text-slate-400" />
                <span className={`text-xs ${overdue ? "text-red-500" : "text-slate-400"}`}>
                  {overdue ? "Prazo encerrado" : `Até ${deadlineLabel}`}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onEdit(goal)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              <Edit size={14} />
            </button>
            <button
              onClick={() => onDelete(goal.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between items-baseline mb-1.5">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {formatCurrency(saved)}
            </span>
            <span className="text-xs text-slate-400">
              de {formatCurrency(target)}
            </span>
          </div>
          <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${percent}%`,
                backgroundColor: done ? "#10b981" : goal.color,
              }}
            />
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-slate-400">{percent.toFixed(0)}% concluído</span>
            {done ? (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 size={12} /> Meta alcançada!
              </span>
            ) : (
              <span className="text-xs text-slate-400">Faltam {formatCurrency(remaining)}</span>
            )}
          </div>
        </div>

        {/* Stats row */}
        {!done && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl px-3 py-2">
              <div className="flex items-center gap-1.5 mb-0.5">
                <TrendingUp size={11} className="text-slate-400" />
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Por mês</span>
              </div>
              <span className="text-sm font-bold" style={{ color: goal.color }}>
                {formatCurrency(monthlyNeeded)}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl px-3 py-2">
              <div className="flex items-center gap-1.5 mb-0.5">
                <CalendarDays size={11} className="text-slate-400" />
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Por dia</span>
              </div>
              <span className="text-sm font-bold" style={{ color: goal.color }}>
                {daysLeft > 0 ? formatCurrency(dailyNeeded) : "—"}
              </span>
            </div>
          </div>
        )}

        {/* Deposit button */}
        {!done && (
          <button
            onClick={() => onDeposit(goal)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: goal.color }}
          >
            <PiggyBank size={15} />
            Registrar Depósito
          </button>
        )}
      </div>
    </div>
  );
}

type FormMode = "create" | "edit" | "deposit" | null;

export function GoalsClient() {
  const { activeGroupId } = useActiveGroup();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { confirm, dialogProps } = useConfirm();

  const [mode, setMode] = useState<FormMode>(null);
  const [editing, setEditing] = useState<Goal | null>(null);

  // Form state — goal
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [savedAmount, setSavedAmount] = useState("");
  const [color, setColor] = useState<string>(COLOR_PALETTE[0]);
  const [emoji, setEmoji] = useState("🎯");
  const [notes, setNotes] = useState("");

  // Deposit state
  const [depositGoal, setDepositGoal] = useState<Goal | null>(null);
  const [depositAmount, setDepositAmount] = useState("");

  // ── Fetch ──────────────────────────────────────────────
  const params = new URLSearchParams();
  if (activeGroupId) params.set("groupId", activeGroupId);

  const { data, isLoading } = useQuery<{ goals: Goal[] }>({
    queryKey: ["goals", activeGroupId],
    queryFn: () => fetch(`/api/goals?${params}`).then((r) => {
      if (!r.ok) return r.json().then((b) => { throw new Error(b?.error ?? `API ${r.status}`); });
      return r.json();
    }),
  });

  // ── Mutations ──────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async (payload: object) => {
      const url = editing ? `/api/goals/${editing.id}` : "/api/goals";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Erro ao salvar");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({ title: editing ? "Meta atualizada!" : "Meta criada!" });
      closeForm();
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const depositMutation = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      const res = await fetch(`/api/goals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ depositAmount: amount }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Erro ao depositar");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({ title: "Depósito registrado!" });
      setMode(null);
      setDepositGoal(null);
      setDepositAmount("");
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({ title: "Meta excluída" });
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  // ── Handlers ───────────────────────────────────────────
  function openCreate() {
    setEditing(null);
    const usedColors = (data?.goals ?? []).map((g) => g.color);
    setColor(suggestPaletteColor(usedColors));
    setName("");
    setTargetAmount("");
    setTargetDate("");
    setSavedAmount("");
    setEmoji("🎯");
    setNotes("");
    setMode("create");
  }

  function openEdit(goal: Goal) {
    setEditing(goal);
    setName(goal.name);
    setTargetAmount(String(parseFloat(goal.targetAmount)));
    setTargetDate(goal.targetDate);
    setSavedAmount(String(parseFloat(goal.savedAmount)));
    setColor(goal.color);
    setEmoji(goal.emoji);
    setNotes(goal.notes ?? "");
    setMode("edit");
  }

  function openDeposit(goal: Goal) {
    setDepositGoal(goal);
    setDepositAmount("");
    setMode("deposit");
  }

  function closeForm() {
    setMode(null);
    setEditing(null);
    setDepositGoal(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    saveMutation.mutate({
      name,
      targetAmount: parseCurrency(targetAmount),
      targetDate,
      savedAmount: parseCurrency(savedAmount) || 0,
      color,
      emoji,
      notes: notes || null,
      groupId: activeGroupId ?? null,
    });
  }

  function handleDeposit(e: React.FormEvent) {
    e.preventDefault();
    if (!depositGoal) return;
    depositMutation.mutate({ id: depositGoal.id, amount: parseCurrency(depositAmount) });
  }

  function handleDelete(id: string) {
    confirm(
      () => deleteMutation.mutate(id),
      { title: "Excluir meta?", description: "Esta ação não pode ser desfeita.", confirmLabel: "Excluir", variant: "danger" },
    );
  }

  const goalList = data?.goals ?? [];

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Metas de Poupança</h1>
          <p className="text-sm text-slate-500 mt-0.5">Planeje suas conquistas financeiras</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#6366f1] hover:bg-[#5558d9] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition"
        >
          <Plus size={16} />
          Nova Meta
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : goalList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Target size={48} className="text-slate-200 dark:text-slate-700 mb-4" />
          <p className="text-slate-500 font-medium">Nenhuma meta criada ainda</p>
          <p className="text-slate-400 text-sm mt-1">Crie sua primeira meta de poupança</p>
          <button
            onClick={openCreate}
            className="mt-5 flex items-center gap-2 bg-[#6366f1] hover:bg-[#5558d9] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition"
          >
            <Plus size={15} />
            Criar Meta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goalList.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={openEdit}
              onDeposit={openDeposit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* ── Goal Form Modal ───────────────────────────── */}
      {(mode === "create" || mode === "edit") && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white dark:bg-slate-800 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl overflow-y-auto max-h-[95vh]">
              {/* Modal header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
                <h2 className="font-semibold text-slate-800 dark:text-slate-100">
                  {editing ? "Editar Meta" : "Nova Meta"}
                </h2>
                <button onClick={closeForm} className="text-slate-400 hover:text-slate-600 transition">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {/* Emoji picker */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Emoji</label>
                  <div className="flex flex-wrap gap-2">
                    {EMOJI_OPTIONS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setEmoji(e)}
                        className={`text-xl p-1.5 rounded-lg transition ${emoji === e ? "bg-[#6366f1]/15 ring-2 ring-[#6366f1]" : "hover:bg-slate-100 dark:hover:bg-slate-700"}`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Nome da meta</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Viagem para Europa"
                    required
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                  />
                </div>

                {/* Target amount */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Valor total (R$)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="0,00"
                    required
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                  />
                </div>

                {/* Target date */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Data limite</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    required
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                  />
                </div>

                {/* Already saved */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Já guardado (R$)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={savedAmount}
                    onChange={(e) => setSavedAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                  />
                </div>

                {/* Color */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Cor</label>
                  <ColorPicker
                    value={color}
                    onChange={setColor}
                    onSuggest={() => setColor(rotatePaletteColor(color))}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Notas (opcional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Observações sobre a meta..."
                    rows={2}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6366f1] resize-none"
                  />
                </div>

                {/* Live preview */}
                {targetAmount && targetDate && (
                  <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-3.5">
                    <p className="text-xs font-medium text-slate-500 mb-2">Previsão de poupança</p>
                    {(() => {
                      const target = parseCurrency(targetAmount);
                      const saved = parseCurrency(savedAmount) || 0;
                      const remaining = Math.max(0, target - saved);
                      const today = new Date();
                      const deadline = parseISO(targetDate);
                      const daysLeft = differenceInCalendarDays(deadline, today);
                      const monthsLeft = Math.max(1, differenceInCalendarMonths(deadline, today) + 1);
                      const monthly = remaining / monthsLeft;
                      const daily = daysLeft > 0 ? remaining / daysLeft : 0;
                      return (
                        <div className="grid grid-cols-2 gap-2 text-center">
                          <div>
                            <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{formatCurrency(monthly)}</p>
                            <p className="text-[11px] text-slate-400">por mês ({monthsLeft} meses)</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{formatCurrency(daily)}</p>
                            <p className="text-[11px] text-slate-400">por dia ({daysLeft} dias)</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="w-full bg-[#6366f1] hover:bg-[#5558d9] disabled:opacity-60 text-white py-3 rounded-xl text-sm font-semibold transition"
                >
                  {saveMutation.isPending ? "Salvando..." : editing ? "Salvar alterações" : "Criar meta"}
                </button>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* ── Deposit Modal ─────────────────────────────── */}
      {mode === "deposit" && depositGoal && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white dark:bg-slate-800 w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-xl">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{depositGoal.emoji}</span>
                  <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                    Depositar em "{depositGoal.name}"
                  </h2>
                </div>
                <button onClick={closeForm} className="text-slate-400 hover:text-slate-600 transition">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleDeposit} className="p-5 space-y-4">
                <div>
                  <p className="text-xs text-slate-500 mb-3">
                    Já guardado: <strong className="text-slate-700 dark:text-slate-200">{formatCurrency(depositGoal.savedAmount)}</strong>
                    {" · "}
                    Faltam: <strong className="text-slate-700 dark:text-slate-200">
                      {formatCurrency(Math.max(0, parseFloat(depositGoal.targetAmount) - parseFloat(depositGoal.savedAmount)))}
                    </strong>
                  </p>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Valor do depósito (R$)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0,00"
                    required
                    autoFocus
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={depositMutation.isPending}
                  className="w-full text-white py-3 rounded-xl text-sm font-semibold transition hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: depositGoal.color }}
                >
                  {depositMutation.isPending ? "Registrando..." : "Confirmar depósito"}
                </button>
              </form>
            </div>
          </div>
        </Portal>
      )}

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
