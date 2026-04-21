"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { FileText, ShieldCheck } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
}

export function ProfileClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ user: User }>({
    queryKey: ["me"],
    queryFn: () => fetch("/api/users/me").then((r) => r.json()),
  });

  const { register, handleSubmit } = useForm({
    values: { name: data?.user?.name ?? "", avatarUrl: data?.user?.avatarUrl ?? "" },
  });

  const updateMutation = useMutation({
    mutationFn: async (d: { name: string; avatarUrl: string }) => {
      await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(d),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      toast({ title: "Perfil atualizado!" });
    },
  });

  const user = data?.user;

  if (isLoading) return <div className="text-slate-400 text-sm">Carregando...</div>;

  return (
    <div className="space-y-6 max-w-lg animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Meu Perfil</h1>
        <p className="text-slate-500 text-sm mt-0.5">Gerencie suas informações pessoais</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center text-2xl font-bold text-brand-700">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">{user?.name}</p>
            <p className="text-sm text-slate-400">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome completo</label>
            <input
              {...register("name", { required: true })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">E-mail</label>
            <input
              value={user?.email}
              disabled
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm bg-slate-50 text-slate-400 cursor-not-allowed"
            />
            <p className="text-xs text-slate-400 mt-1">O e-mail não pode ser alterado</p>
          </div>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition disabled:opacity-50"
          >
            {updateMutation.isPending ? "Salvando..." : "Salvar alterações"}
          </button>
        </form>
      </div>
      {/* Legal */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-3.5 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Legal</h2>
        </div>
        <div className="divide-y divide-slate-50">
          <Link
            href="/termos"
            target="_blank"
            className="flex items-center gap-3 px-6 py-4 hover:bg-slate-50 transition group"
          >
            <FileText size={16} className="text-slate-400 group-hover:text-brand-600 transition shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-700">Termos de Uso</p>
              <p className="text-xs text-slate-400">Última atualização: 21 de abril de 2026</p>
            </div>
            <span className="text-xs text-slate-400 group-hover:text-brand-600 transition">↗</span>
          </Link>
          <Link
            href="/privacidade"
            target="_blank"
            className="flex items-center gap-3 px-6 py-4 hover:bg-slate-50 transition group"
          >
            <ShieldCheck size={16} className="text-slate-400 group-hover:text-brand-600 transition shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-700">Política de Privacidade</p>
              <p className="text-xs text-slate-400">Conforme a LGPD – Lei nº 13.709/2018</p>
            </div>
            <span className="text-xs text-slate-400 group-hover:text-brand-600 transition">↗</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
