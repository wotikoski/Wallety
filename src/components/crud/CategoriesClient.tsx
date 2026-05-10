"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActiveGroup } from "@/lib/hooks/useActiveGroup";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useUndoDelete } from "@/lib/hooks/useUndoDelete";
import { Plus, Trash2, Edit, Check } from "lucide-react";
import { COLOR_PALETTE, ColorPicker, suggestPaletteColor, rotatePaletteColor } from "@/components/ui/ColorPicker";
import { PageHeader, PrimaryButton } from "@/components/layout/PageHeader";
import { FormModal, formInputCls, formLabelCls } from "@/components/ui/FormModal";

/** Common category emojis, grouped visually. Covers most finance use cases. */
const EMOJI_SUGGESTIONS = [
  "🍽️", "🛒", "🏠", "🚗", "⛽", "🚌",
  "💊", "🏥", "🎓", "📚", "💼", "💰",
  "👕", "💡", "📱", "🎬", "🎮", "✈️",
  "🐶", "🎁", "💳", "🏦", "📈", "🔧",
];

/** Pick the first palette color not yet used by categories of the same type. */
function suggestColor(type: string, categories: Category[]): string {
  const typeCats = categories.filter((c) => c.type === type || c.type === "both" || type === "both");
  return suggestPaletteColor(typeCats.map((c) => c.color));
}

interface Category {
  id: string;
  name: string;
  type: string;
  icon: string | null;
  color: string | null;
  isDefault: boolean;
}

interface FormData {
  name: string;
  type: "income" | "expense" | "both";
  icon: string;
  color: string;
}

export function CategoriesClient() {
  const { activeGroupId } = useActiveGroup();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const params = new URLSearchParams();
  if (activeGroupId) params.set("groupId", activeGroupId);

  const { data, isLoading } = useQuery<{ categories: Category[] }>({
    queryKey: ["categories", "all", activeGroupId],
    queryFn: () => fetch(`/api/categories?${params}`).then((r) => { if (!r.ok) { return r.json().then((b) => { throw new Error(b?.error ?? `API ${r.status}`); }); } return r.json(); }),
  });

  const { schedule, isPending } = useUndoDelete();

  const { register, handleSubmit, reset, watch, setValue } = useForm<FormData>({
    defaultValues: { type: "expense", icon: "💳", color: COLOR_PALETTE[0] },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const url = editing ? `/api/categories/${editing.id}` : "/api/categories";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, groupId: activeGroupId }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Erro ao salvar categoria");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      // Category colors flow into reports, dashboard donut and budget rows.
      queryClient.invalidateQueries({ queryKey: ["report"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast({ title: editing ? "Categoria atualizada!" : "Categoria criada!" });
      reset();
      setShowForm(false);
      setEditing(null);
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const askDelete = (id: string, name: string) =>
    schedule(id, `Categoria "${name}" excluída`, async () => {
      await fetch(`/api/categories/${id}`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["report"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    });

  const categories = (data?.categories ?? []).filter((c) => !isPending(c.id));
  const incomeCategories = categories.filter((c) => c.type === "income" || c.type === "both");
  const expenseCategories = categories.filter((c) => c.type === "expense" || c.type === "both");

  function startEdit(cat: Category) {
    setEditing(cat);
    reset({ name: cat.name, type: cat.type as "income" | "expense" | "both", icon: cat.icon ?? "", color: cat.color ?? COLOR_PALETTE[0] });
    setShowForm(true);
  }

  function startNew() {
    setEditing(null);
    reset({ type: "expense", icon: "💳", color: suggestColor("expense", categories), name: "" });
    setShowForm(true);
  }

  // When user switches type in the form (for a new category), refresh suggested color.
  const watchedType = watch("type");
  const watchedColor = watch("color");
  const watchedIcon = watch("icon");

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Categorias"
        subtitle="Organize seus lançamentos por categoria"
        right={
          <PrimaryButton
            onClick={() => { if (showForm) { setShowForm(false); setEditing(null); reset(); } else startNew(); }}
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Nova Categoria</span>
          </PrimaryButton>
        }
      />

      {/* Form modal */}
      <FormModal
        open={showForm}
        title={editing ? "Editar Categoria" : "Nova Categoria"}
        onClose={() => { setShowForm(false); setEditing(null); reset(); }}
        onSubmit={handleSubmit((d) => saveMutation.mutate(d))}
        submitLabel={editing ? "Salvar alterações" : "Criar categoria"}
        submitting={saveMutation.isPending}
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={formLabelCls}>Nome</label>
            <input
              {...register("name", { required: true })}
              className={formInputCls}
              placeholder="Ex: Alimentação"
            />
          </div>
          <div>
            <label className={formLabelCls}>Tipo</label>
            <select {...register("type")} className={formInputCls}>
              <option value="expense">Despesa</option>
              <option value="income">Receita</option>
              <option value="both">Ambos</option>
            </select>
          </div>
        </div>

        <div>
          <label className={formLabelCls}>Ícone</label>
          <div className="flex items-start gap-3">
            <div
              className="w-14 h-14 rounded-[10px] flex items-center justify-center text-2xl shrink-0 border border-[var(--color-border)]"
              style={{ backgroundColor: (watchedColor ?? "#3b82f6") + "22" }}
            >
              {watchedIcon || "💳"}
            </div>
            <div className="flex-1 grid grid-cols-8 gap-1.5">
              {EMOJI_SUGGESTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setValue("icon", e)}
                  className={`h-9 rounded-[8px] text-lg flex items-center justify-center transition ${
                    watchedIcon === e
                      ? "bg-[rgba(59,130,246,.15)] ring-2 ring-[#3b82f6]"
                      : "hover:bg-[var(--surface-raised)]"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <input type="hidden" {...register("icon")} />
        </div>

        <div>
          <label className={formLabelCls}>Cor</label>
          <ColorPicker
            value={watchedColor ?? COLOR_PALETTE[0]}
            onChange={(c) => setValue("color", c)}
            showSuggest={!editing}
            onSuggest={() => setValue("color", rotatePaletteColor(watchedColor))}
          />
        </div>
      </FormModal>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[var(--surface-card)] rounded-[14px] border border-[var(--color-border)] overflow-hidden">
            <ListSkeleton rows={4} />
          </div>
          <div className="bg-[var(--surface-card)] rounded-[14px] border border-[var(--color-border)] overflow-hidden">
            <ListSkeleton rows={4} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CategoryGroup
            title="Receitas"
            categories={incomeCategories}
            onEdit={startEdit}
            onDelete={(id, name) => askDelete(id, name)}
            color="income"
          />
          <CategoryGroup
            title="Despesas"
            categories={expenseCategories}
            onEdit={startEdit}
            onDelete={(id, name) => askDelete(id, name)}
            color="expense"
          />
        </div>
      )}

    </div>
  );
}

function CategoryGroup({
  title, categories, onEdit, onDelete, color,
}: {
  title: string;
  categories: Category[];
  onEdit: (cat: Category) => void;
  onDelete: (id: string, name: string) => void;
  color: "income" | "expense";
}) {
  return (
    <div className="bg-[var(--surface-card)] rounded-[14px] border border-[var(--color-border)] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[var(--color-border)] flex items-center justify-between">
        <h2 className="text-[14px] font-semibold text-[var(--color-text)] m-0">
          {title}
        </h2>
        <span className="text-[11px] font-bold uppercase tracking-[0.07em] text-[var(--text-mute)] tabular-nums">
          {categories.length}
        </span>
      </div>
      <div className="divide-y divide-[#f1f3f9]">
        {categories.length === 0 ? (
          <p className="px-6 py-8 text-[13px] text-app-muted text-center">Nenhuma categoria</p>
        ) : (
          categories.map((cat) => (
            <div key={cat.id} className="flex items-center px-5 py-3 gap-3 hover:bg-[#f8f9fd] transition">
              <div
                className="w-8 h-8 rounded-[8px] flex items-center justify-center text-sm shrink-0"
                style={{ backgroundColor: cat.color ? cat.color + "20" : "#f1f5f9" }}
              >
                {cat.icon || "💳"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-app-text">{cat.name}</p>
                {cat.isDefault && <span className="text-[11px] text-app-muted">Padrão</span>}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEdit(cat)}
                  className="p-1.5 text-app-muted hover:text-[#3b82f6] hover:bg-[rgba(59,130,246,.08)] rounded-[8px] transition"
                >
                  <Edit size={13} />
                </button>
                {!cat.isDefault && (
                  <button
                    onClick={() => onDelete(cat.id, cat.name)}
                    className="p-1.5 text-app-muted hover:text-expense hover:bg-[rgba(248,113,113,.1)] rounded-[8px] transition"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
