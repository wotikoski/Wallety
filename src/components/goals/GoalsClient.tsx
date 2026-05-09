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
  PiggyBank,
  CheckCircle2,
} from "lucide-react";
import { differenceInCalendarDays, differenceInCalendarMonths, format, parseISO, isPast } from "date-fns";
import { PageHeader, PrimaryButton } from "@/components/layout/PageHeader";

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

const EMOJI_OPTIONS = [
  "🎯","✈️","🏠","🚗","📱","💻","🎓","💍","🏋️","🎉",
  "🌴","🛍️","🏖️","🎸","📷","⛵","🏔️","🎁",
];

function computeGoalStats(goal: Goal) {
  const target = parseFloat(goal.targetAmount);
  const saved = parseFloat(goal.savedAmount);
  const remaining = Math.max(0, target - saved);
  const percent = target > 0 ? Math.min(100, (saved / target) * 100) : 0;
  const done = saved >= target;

  const today = new Date();
  const deadline = parseISO(goal.targetDate);
  const daysLeft = differenceInCalendarDays(deadline, today);
  const monthsLeft = Math.max(1, differenceInCalendarMonths(deadline, today) + 1);
  const monthlyNeeded = remaining > 0 && monthsLeft > 0 ? remaining / monthsLeft : 0;
  const overdue = !done && isPast(deadline);

  return { target, saved, remaining, percent, done, daysLeft, monthsLeft, monthlyNeeded, overdue };
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
  const { target, saved, remaining, percent, done, daysLeft, monthlyNeeded, overdue } =
    computeGoalStats(goal);

  const deadlineLabel = format(parseISO(goal.targetDate), "dd/MM/yyyy");

  return (
    <div
      className="rounded-[14px] border border-[var(--color-border)] bg-[var(--surface-card)] overflow-hidden flex flex-col"
    >
      {/* Header row */}
      <div className="p-5 pb-4 flex items-start gap-3">
        {/* Emoji icon */}
        <div
          className="w-[28px] h-[28px] rounded-[8px] flex items-center justify-center text-[15px] shrink-0"
          style={{ background: "rgba(59,130,246,0.12)" }}
        >
          {goal.emoji}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-semibold text-[var(--color-text)] truncate leading-snug">
            {goal.name}
          </h3>
          <div className="flex items-center gap-1 mt-0.5">
            <CalendarDays size={10} className="text-[var(--text-faint)]" />
            <span
              className="text-[11px] font-medium"
              style={{ color: overdue ? "#f87171" : "var(--text-faint)" }}
            >
              {overdue ? "Prazo encerrado" : `Até ${deadlineLabel}`}
            </span>
          </div>
        </div>

        {/* Percent chip */}
        <div
          className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-bold"
          style={{
            background: done
              ? "rgba(34,197,94,0.15)"
              : "rgba(59,130,246,0.12)",
            color: done ? "#22c55e" : "#3b82f6",
          }}
        >
          {percent.toFixed(0)}%
        </div>
      </div>

      {/* Values */}
      <div className="px-5 pb-3">
        <div className="flex items-baseline justify-between mb-2">
          <span
            className="text-[22px] font-semibold leading-none"
            style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "-0.025em", color: "var(--color-text)" }}
          >
            {formatCurrency(saved)}
          </span>
          <span className="text-[11px] font-medium" style={{ color: "var(--text-faint)" }}>
            de {formatCurrency(target)}
          </span>
        </div>

        {/* Progress bar — 6px, gradient accent.deep → accent.hue */}
        <div
          className="w-full rounded-full overflow-hidden"
          style={{ height: 6, background: "var(--surface-raised)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${percent}%`,
              background: done
                ? "#22c55e"
                : "linear-gradient(90deg, #2563eb, #3b82f6)",
            }}
          />
        </div>

        {/* Remaining + monthly hint */}
        {!done && (
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>
              Faltam{" "}
              <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--text-dim)" }}>
                {formatCurrency(remaining)}
              </span>
            </span>
            {monthlyNeeded > 0 && (
              <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>
                ~{" "}
                <span style={{ fontVariantNumeric: "tabular-nums", color: "#3b82f6" }}>
                  {formatCurrency(monthlyNeeded)}
                </span>
                /mês
              </span>
            )}
          </div>
        )}

        {done && (
          <div className="flex items-center gap-1.5 mt-2">
            <CheckCircle2 size={13} className="text-[#22c55e]" />
            <span className="text-[11px] font-semibold text-[#22c55e]">Meta alcançada!</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 pb-5 mt-auto flex items-center gap-2 pt-3 border-t border-[var(--color-border)]">
        {!done && (
          <button
            onClick={() => onDeposit(goal)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-[9px] text-[12px] font-semibold text-white bg-[#3b82f6] hover:bg-[#2563eb] transition-colors duration-150"
          >
            <PiggyBank size={13} />
            Depositar
          </button>
        )}
        <button
          onClick={() => onEdit(goal)}
          className="p-2 rounded-[9px] text-[var(--text-faint)] hover:text-[var(--text-dim)] hover:bg-[var(--surface-raised)] transition-colors duration-150"
        >
          <Edit size={14} />
        </button>
        <button
          onClick={() => onDelete(goal.id)}
          className="p-2 rounded-[9px] text-[var(--text-faint)] hover:text-[#f87171] hover:bg-[rgba(248,113,113,0.1)] transition-colors duration-150"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

/** Dashed "Nova Meta" card matching handoff */
function NewGoalCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-[14px] border-2 border-dashed border-[var(--color-border)] bg-transparent hover:border-[#3b82f6] hover:bg-[rgba(59,130,246,0.04)] transition-all duration-150 flex flex-col items-center justify-center gap-3 p-8 min-h-[160px] w-full"
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center"
        style={{ background: "rgba(59,130,246,0.12)" }}
      >
        <Plus size={18} className="text-[#3b82f6]" />
      </div>
      <span className="text-[13px] font-semibold text-[var(--text-mute)]">Nova meta</span>
    </button>
  );
}

type FormMode = "create" | "edit" | "deposit" | null;

// ── Modal input shared style ─────────────────────────────────────────────────
const inputCls =
  "w-full border border-[var(--color-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] " +
  "bg-[var(--surface-raised)] text-[var(--color-text)] placeholder-[var(--text-faint)] " +
  "focus:outline-none focus:ring-2 focus:ring-[#3b82f6] transition";

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
    queryFn: () =>
      fetch(`/api/goals?${params}`).then((r) => {
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
    setName(""); setTargetAmount(""); setTargetDate("");
    setSavedAmount(""); setEmoji("🎯"); setNotes("");
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
    <div className="animate-fade-in">
      <PageHeader
        title="Metas de Poupança"
        subtitle="Planeje e acompanhe suas conquistas financeiras"
        right={
          <PrimaryButton onClick={openCreate}>
            <Plus size={15} />
            <span className="hidden sm:inline">Nova Meta</span>
          </PrimaryButton>
        }
      />

      {isLoading ? (
        <ListSkeleton rows={4} />
      ) : goalList.length === 0 ? (
        /* Empty state — just show the dashed card centered */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
          <NewGoalCard onClick={openCreate} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {goalList.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={openEdit}
              onDeposit={openDeposit}
              onDelete={handleDelete}
            />
          ))}
          <NewGoalCard onClick={openCreate} />
        </div>
      )}

      {/* ── Goal Form Modal ─────────────────────────────────── */}
      {(mode === "create" || mode === "edit") && (
        <Portal>
          <div className="fixed inset-0 bg-black/55 backdrop-blur-[6px] z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div
              className="w-full sm:max-w-md rounded-t-2xl sm:rounded-[16px] overflow-y-auto"
              style={{
                maxHeight: "95vh",
                background: "var(--surface-card)",
                border: "1px solid var(--color-border)",
              }}
            >
              {/* Modal header */}
              <div
                className="flex items-center justify-between px-6 py-4 sticky top-0"
                style={{
                  background: "var(--surface-card)",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <h2 className="text-[15px] font-semibold text-[var(--color-text)]">
                  {editing ? "Editar Meta" : "Nova Meta"}
                </h2>
                <button
                  onClick={closeForm}
                  className="text-[var(--text-faint)] hover:text-[var(--text-dim)] transition p-1"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Emoji picker */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.07em] text-[var(--text-mute)] mb-2">
                    Emoji
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {EMOJI_OPTIONS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setEmoji(e)}
                        className={`text-lg p-1.5 rounded-[8px] transition-colors duration-150 ${
                          emoji === e
                            ? "bg-[rgba(59,130,246,0.15)] ring-2 ring-[#3b82f6]"
                            : "hover:bg-[var(--surface-raised)]"
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.07em] text-[var(--text-mute)] mb-1.5">
                    Nome da meta
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Viagem para Europa"
                    required
                    className={inputCls}
                  />
                </div>

                {/* Target amount */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.07em] text-[var(--text-mute)] mb-1.5">
                    Valor total (R$)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="0,00"
                    required
                    className={inputCls}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  />
                </div>

                {/* Target date */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.07em] text-[var(--text-mute)] mb-1.5">
                    Data limite
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    required
                    className={inputCls}
                  />
                </div>

                {/* Already saved */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.07em] text-[var(--text-mute)] mb-1.5">
                    Já guardado (R$)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={savedAmount}
                    onChange={(e) => setSavedAmount(e.target.value)}
                    placeholder="0,00"
                    className={inputCls}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  />
                </div>

                {/* Color */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.07em] text-[var(--text-mute)] mb-1.5">
                    Cor
                  </label>
                  <ColorPicker
                    value={color}
                    onChange={setColor}
                    onSuggest={() => setColor(rotatePaletteColor(color))}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.07em] text-[var(--text-mute)] mb-1.5">
                    Notas (opcional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Observações sobre a meta..."
                    rows={2}
                    className={`${inputCls} resize-none`}
                  />
                </div>

                {/* Live preview */}
                {targetAmount && targetDate && (
                  <div
                    className="rounded-[10px] p-4"
                    style={{ background: "var(--surface-raised)" }}
                  >
                    <p className="text-[11px] font-bold uppercase tracking-[0.07em] text-[var(--text-mute)] mb-3">
                      Previsão de poupança
                    </p>
                    {(() => {
                      const tgt = parseCurrency(targetAmount);
                      const sav = parseCurrency(savedAmount) || 0;
                      const rem = Math.max(0, tgt - sav);
                      const today = new Date();
                      const deadline = parseISO(targetDate);
                      const daysLeft = differenceInCalendarDays(deadline, today);
                      const monthsLeft = Math.max(1, differenceInCalendarMonths(deadline, today) + 1);
                      const monthly = rem / monthsLeft;
                      return (
                        <div className="grid grid-cols-2 gap-3 text-center">
                          <div>
                            <p
                              className="text-[18px] font-semibold text-[var(--color-text)]"
                              style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                              {formatCurrency(monthly)}
                            </p>
                            <p className="text-[11px] text-[var(--text-faint)]">
                              por mês ({monthsLeft} meses)
                            </p>
                          </div>
                          <div>
                            <p
                              className="text-[18px] font-semibold text-[var(--color-text)]"
                              style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                              {daysLeft > 0 ? formatCurrency(rem / daysLeft) : "—"}
                            </p>
                            <p className="text-[11px] text-[var(--text-faint)]">
                              por dia ({daysLeft} dias)
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="w-full bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-60 text-white py-3 rounded-[10px] text-[13px] font-semibold transition-colors duration-150"
                >
                  {saveMutation.isPending ? "Salvando..." : editing ? "Salvar alterações" : "Criar meta"}
                </button>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* ── Deposit Modal ─────────────────────────────────── */}
      {mode === "deposit" && depositGoal && (
        <Portal>
          <div className="fixed inset-0 bg-black/55 backdrop-blur-[6px] z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div
              className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-[16px]"
              style={{
                background: "var(--surface-card)",
                border: "1px solid var(--color-border)",
              }}
            >
              <div
                className="flex items-center justify-between px-6 py-4"
                style={{ borderBottom: "1px solid var(--color-border)" }}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{depositGoal.emoji}</span>
                  <h2 className="text-[14px] font-semibold text-[var(--color-text)]">
                    Depositar em "{depositGoal.name}"
                  </h2>
                </div>
                <button
                  onClick={closeForm}
                  className="text-[var(--text-faint)] hover:text-[var(--text-dim)] transition p-1"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleDeposit} className="p-6 space-y-4">
                <p className="text-[12px] text-[var(--text-mute)]">
                  Já guardado:{" "}
                  <span
                    className="text-[var(--color-text)] font-semibold"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {formatCurrency(depositGoal.savedAmount)}
                  </span>
                  {" · "}
                  Faltam:{" "}
                  <span
                    className="text-[var(--color-text)] font-semibold"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {formatCurrency(
                      Math.max(
                        0,
                        parseFloat(depositGoal.targetAmount) - parseFloat(depositGoal.savedAmount),
                      ),
                    )}
                  </span>
                </p>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.07em] text-[var(--text-mute)] mb-1.5">
                    Valor do depósito (R$)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0,00"
                    required
                    autoFocus
                    className={inputCls}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={depositMutation.isPending}
                  className="w-full bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-60 text-white py-3 rounded-[10px] text-[13px] font-semibold transition-colors duration-150"
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
