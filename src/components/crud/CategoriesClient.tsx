"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActiveGroup } from "@/lib/hooks/useActiveGroup";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useConfirm } from "@/lib/hooks/useConfirm";
import { Plus, Trash2, Edit, X, Check } from "lucide-react";
import { COLOR_PALETTE, ColorPicker, suggestPaletteColor, rotatePaletteColor } from "@/components/ui/ColorPicker";

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
  const formRef = useRef<HTMLDivElement>(null);

  const params = new URLSearchParams();
  if (activeGroupId) params.set("groupId", activeGroupId);

  const { data, isLoading } = useQuery<{ categories: Category[] }>({
    queryKey: ["categories", "all", activeGroupId],
    queryFn: () => fetch(`/api/categories?${params}`).then((r) => r.json()),
  });

  const { confirm, dialogProps } = useConfirm();

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
      toast({ title: editing ? "Categoria atualizada!" : "Categoria criada!" });
      reset();
      setShowForm(false);
      setEditing(null);
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Erro ao excluir categoria");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "Categoria excluída" });
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const askDelete = (id: string, name: string) =>
    confirm(() => deleteMutation.mutate(id), {
      title: "Excluir categoria",
      description: `Tem certeza que deseja excluir "${name}"? Lançamentos que usam essa categoria ficarão sem categoria.`,
      confirmLabel: "Excluir",
    });

  const categories = data?.categories ?? [];
  const incomeCategories = categories.filter((c) => c.type === "income" || c.type === "both");
  const expenseCategories = categories.filter((c) => c.type === "expense" || c.type === "both");

  function startEdit(cat: Category) {
    setEditing(cat);
    reset({ name: cat.name, type: cat.type as "income" | "expense" | "both", icon: cat.icon ?? "", color: cat.color ?? COLOR_PALETTE[0] });
    setShowForm(true);
    // Scroll the form into view after React renders it.
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
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
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold text-app-text tracking-tight">Categorias</h1>
          <p className="text-app-muted text-[13px] mt-0.5 font-medium">Organize seus lançamentos por categoria</p>
        </div>
        <button
          onClick={() => { if (showForm) { setShowForm(false); setEditing(null); reset(); } else startNew(); }}
          title="Nova Categoria"
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-3.5 h-9 rounded-lg transition"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Nova Categoria</span>
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div ref={formRef} className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800 mb-4">{editing ? "Editar" : "Nova"} Categoria</h2>
          <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome</label>
              <input
                {...register("name", { required: true })}
                className="w-full h-9 px-3.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Ex: Alimentação"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo</label>
              <select {...register("type")} className="w-full h-9 px-3.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
                <option value="both">Ambos</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Ícone</label>
              <div className="flex items-start gap-3">
                {/* Preview */}
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0 border border-slate-200"
                  style={{ backgroundColor: (watchedColor ?? "#6366f1") + "22" }}
                >
                  {watchedIcon || "💳"}
                </div>
                {/* Emoji grid */}
                <div className="flex-1 grid grid-cols-8 gap-1.5">
                  {EMOJI_SUGGESTIONS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setValue("icon", e)}
                      className={`h-9 rounded-lg text-lg flex items-center justify-center transition ${
                        watchedIcon === e
                          ? "bg-brand-50 ring-2 ring-brand-500"
                          : "hover:bg-slate-100"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              {/* Hidden field so the form carries the icon value. */}
              <input type="hidden" {...register("icon")} />
            </div>
            <div className="col-span-2">
              <ColorPicker
                value={watchedColor ?? COLOR_PALETTE[0]}
                onChange={(c) => setValue("color", c)}
                showSuggest={!editing}
                onSuggest={() => setValue("color", rotatePaletteColor(watchedColor))}
              />
            </div>
            <div className="col-span-2 flex gap-3">
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditing(null); reset(); }}
                className="flex-1 h-9 px-4 rounded-[10px] border-[1.5px] border-app-border text-[13px] font-semibold text-app-muted hover:bg-white hover:text-app-text transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="flex-1 h-9 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 rounded-lg transition disabled:opacity-50"
              >
                {saveMutation.isPending ? "Salvando..." : editing ? "Atualizar" : "Criar"}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-[14px] border border-app-border shadow-card overflow-hidden">
            <ListSkeleton rows={4} />
          </div>
          <div className="bg-white rounded-[14px] border border-app-border shadow-card overflow-hidden">
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

      <ConfirmDialog {...dialogProps} loading={deleteMutation.isPending} />
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
    <div className="bg-white rounded-[14px] border border-app-border shadow-card overflow-hidden">
      <div className={`px-6 py-3.5 border-b border-slate-100 ${color === "income" ? "bg-income-light" : "bg-expense-light"}`}>
        <h2 className={`text-sm font-semibold ${color === "income" ? "text-income-dark" : "text-expense-dark"}`}>
          {title} · {categories.length}
        </h2>
      </div>
      <div className="divide-y divide-[#f1f3f9]">
        {categories.length === 0 ? (
          <p className="px-6 py-8 text-[13px] text-app-muted text-center">Nenhuma categoria</p>
        ) : (
          categories.map((cat) => (
            <div key={cat.id} className="flex items-center px-5 py-3 gap-3 hover:bg-[#f8f9fd] transition">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
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
                  className="p-1.5 text-app-muted hover:text-brand-500 hover:bg-[rgba(99,102,241,.08)] rounded-lg transition"
                >
                  <Edit size={13} />
                </button>
                {!cat.isDefault && (
                  <button
                    onClick={() => onDelete(cat.id, cat.name)}
                    className="p-1.5 text-app-muted hover:text-expense hover:bg-[rgba(248,113,113,.1)] rounded-lg transition"
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
