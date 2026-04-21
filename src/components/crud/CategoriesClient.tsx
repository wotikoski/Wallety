"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActiveGroup } from "@/lib/hooks/useActiveGroup";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useConfirm } from "@/lib/hooks/useConfirm";
import { Plus, Trash2, Edit, X, Check, Shuffle } from "lucide-react";

/** Curated palette with good contrast on white backgrounds. */
const COLOR_PALETTE = [
  "#6173f4", // brand blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
  "#06b6d4", // cyan
  "#84cc16", // lime
  "#a855f7", // purple
  "#facc15", // yellow
];

/** Pick the first palette color not yet used by categories of the same type. */
function suggestColor(type: string, categories: Category[]): string {
  const typeCats = categories.filter((c) => c.type === type || c.type === "both" || type === "both");
  const used = new Set(typeCats.map((c) => (c.color ?? "").toLowerCase()));
  for (const c of COLOR_PALETTE) {
    if (!used.has(c.toLowerCase())) return c;
  }
  return COLOR_PALETTE[typeCats.length % COLOR_PALETTE.length];
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
  }

  function startNew() {
    setEditing(null);
    reset({ type: "expense", icon: "💳", color: suggestColor("expense", categories), name: "" });
    setShowForm(true);
  }

  // When user switches type in the form (for a new category), refresh suggested color.
  const watchedType = watch("type");
  const watchedColor = watch("color");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Categorias</h1>
          <p className="text-slate-500 text-sm mt-0.5">Organize seus lançamentos por categoria</p>
        </div>
        <button
          onClick={() => { if (showForm) { setShowForm(false); setEditing(null); reset(); } else startNew(); }}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
        >
          <Plus size={16} />
          Nova Categoria
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800 mb-4">{editing ? "Editar" : "Nova"} Categoria</h2>
          <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome</label>
              <input
                {...register("name", { required: true })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Ex: Alimentação"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo</label>
              <select {...register("type")} className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
                <option value="both">Ambos</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Ícone (emoji)</label>
              <input
                {...register("icon")}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="🍽️"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-slate-700">Cor</label>
                {!editing && (
                  <button
                    type="button"
                    onClick={() => setValue("color", suggestColor(watchedType, categories.filter((c) => c.color !== watchedColor)))}
                    className="text-xs text-slate-400 hover:text-brand-600 inline-flex items-center gap-1"
                    title="Sugerir outra cor"
                  >
                    <Shuffle size={11} />
                    Sugerir
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  {...register("color")}
                  type="color"
                  className="w-12 h-10 rounded-lg border border-slate-200 cursor-pointer shrink-0"
                />
                <div className="flex-1 flex flex-wrap gap-1.5">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setValue("color", c)}
                      className={`w-6 h-6 rounded-md border transition ${watchedColor?.toLowerCase() === c.toLowerCase() ? "border-slate-900 ring-2 ring-slate-900/20" : "border-slate-200 hover:scale-110"}`}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="col-span-2 flex gap-3">
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditing(null); reset(); }}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="flex-1 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition disabled:opacity-50"
              >
                {saveMutation.isPending ? "Salvando..." : editing ? "Atualizar" : "Criar"}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <ListSkeleton rows={4} />
          </div>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
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
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <div className={`px-6 py-3.5 border-b border-slate-100 ${color === "income" ? "bg-income-light" : "bg-expense-light"}`}>
        <h2 className={`text-sm font-semibold ${color === "income" ? "text-income-dark" : "text-expense-dark"}`}>
          {title} · {categories.length}
        </h2>
      </div>
      <div className="divide-y divide-slate-50">
        {categories.length === 0 ? (
          <p className="px-6 py-8 text-sm text-slate-400 text-center">Nenhuma categoria</p>
        ) : (
          categories.map((cat) => (
            <div key={cat.id} className="flex items-center px-5 py-3 gap-3 hover:bg-slate-50/50 transition">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                style={{ backgroundColor: cat.color ? cat.color + "20" : "#f1f5f9" }}
              >
                {cat.icon || "💳"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">{cat.name}</p>
                {cat.isDefault && <span className="text-xs text-slate-400">Padrão</span>}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEdit(cat)}
                  className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                >
                  <Edit size={13} />
                </button>
                {!cat.isDefault && (
                  <button
                    onClick={() => onDelete(cat.id, cat.name)}
                    className="p-1.5 text-slate-400 hover:text-expense hover:bg-expense-light rounded-lg transition"
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
