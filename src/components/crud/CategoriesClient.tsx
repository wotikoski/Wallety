"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActiveGroup } from "@/lib/hooks/useActiveGroup";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, Edit, X, Check } from "lucide-react";

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

  const { data } = useQuery<{ categories: Category[] }>({
    queryKey: ["categories", "all", activeGroupId],
    queryFn: () => fetch(`/api/categories?${params}`).then((r) => r.json()),
  });

  const { register, handleSubmit, reset } = useForm<FormData>({
    defaultValues: { type: "expense", icon: "💳", color: "#6173f4" },
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
      if (!res.ok) throw new Error("Erro ao salvar");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: editing ? "Categoria atualizada!" : "Categoria criada!" });
      reset();
      setShowForm(false);
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/categories/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "Categoria excluída" });
    },
  });

  const categories = data?.categories ?? [];
  const incomeCategories = categories.filter((c) => c.type === "income" || c.type === "both");
  const expenseCategories = categories.filter((c) => c.type === "expense" || c.type === "both");

  function startEdit(cat: Category) {
    setEditing(cat);
    reset({ name: cat.name, type: cat.type as "income" | "expense" | "both", icon: cat.icon ?? "", color: cat.color ?? "#6173f4" });
    setShowForm(true);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Categorias</h1>
          <p className="text-slate-500 text-sm mt-0.5">Organize seus lançamentos por categoria</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditing(null); reset(); }}
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
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Cor</label>
              <input
                {...register("color")}
                type="color"
                className="w-full h-10 rounded-lg border border-slate-200 cursor-pointer"
              />
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CategoryGroup
          title="Receitas"
          categories={incomeCategories}
          onEdit={startEdit}
          onDelete={(id) => confirm("Excluir categoria?") && deleteMutation.mutate(id)}
          color="income"
        />
        <CategoryGroup
          title="Despesas"
          categories={expenseCategories}
          onEdit={startEdit}
          onDelete={(id) => confirm("Excluir categoria?") && deleteMutation.mutate(id)}
          color="expense"
        />
      </div>
    </div>
  );
}

function CategoryGroup({
  title, categories, onEdit, onDelete, color,
}: {
  title: string;
  categories: Category[];
  onEdit: (cat: Category) => void;
  onDelete: (id: string) => void;
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
                    onClick={() => onDelete(cat.id)}
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
