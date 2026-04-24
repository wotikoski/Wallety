"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { FileText, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");

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

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/users/me", { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Erro ao excluir conta");
      }
    },
    onSuccess: () => {
      queryClient.clear();
      router.push("/login");
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
      setShowDeleteDialog(false);
    },
  });

  const user = data?.user;
  const emailMatches = confirmEmail.trim().toLowerCase() === user?.email?.toLowerCase();

  if (isLoading) return <div className="text-slate-400 text-sm">Carregando...</div>;

  return (
    <div className="space-y-6 max-w-lg animate-fade-in">
      <div>
        <h1 className="text-[22px] font-extrabold text-app-text tracking-tight">Meu Perfil</h1>
        <p className="text-app-muted text-[13px] mt-0.5 font-medium">Gerencie suas informaÃ§Ãµes pessoais</p>
      </div>

      {/* Profile form */}
      <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-[14px] bg-brand-100 flex items-center justify-center text-2xl font-bold text-brand-700">
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
            <p className="text-xs text-slate-400 mt-1">O e-mail nÃ£o pode ser alterado</p>
          </div>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition disabled:opacity-50"
          >
            {updateMutation.isPending ? "Salvando..." : "Salvar alteraÃ§Ãµes"}
          </button>
        </form>
      </div>

      {/* Legal */}
      <div className="bg-white rounded-[14px] border border-app-border shadow-card overflow-hidden">
        <div className="px-6 py-3.5 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Legal</h2>
        </div>
        <div className="divide-y divide-[#f1f3f9]">
          <Link
            href="/termos"
            target="_blank"
            className="flex items-center gap-3 px-6 py-4 hover:bg-slate-50 transition group"
          >
            <FileText size={16} className="text-slate-400 group-hover:text-brand-600 transition shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-700">Termos de Uso</p>
              <p className="text-xs text-slate-400">Ãšltima atualizaÃ§Ã£o: 21 de abril de 2026</p>
            </div>
            <span className="text-xs text-slate-400 group-hover:text-brand-600 transition">â†—</span>
          </Link>
          <Link
            href="/privacidade"
            target="_blank"
            className="flex items-center gap-3 px-6 py-4 hover:bg-slate-50 transition group"
          >
            <ShieldCheck size={16} className="text-slate-400 group-hover:text-brand-600 transition shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-700">PolÃ­tica de Privacidade</p>
              <p className="text-xs text-slate-400">Conforme a LGPD â€“ Lei nÂº 13.709/2018</p>
            </div>
            <span className="text-xs text-slate-400 group-hover:text-brand-600 transition">â†—</span>
          </Link>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-xl border border-red-100 shadow-sm overflow-hidden">
        <div className="px-6 py-3.5 border-b border-red-100 bg-red-50/60">
          <h2 className="text-sm font-semibold text-red-700">Zona de Perigo</h2>
        </div>
        <div className="px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-800">Excluir minha conta</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Todos os seus dados serÃ£o removidos permanentemente. Esta aÃ§Ã£o nÃ£o pode ser desfeita.
            </p>
          </div>
          <button
            onClick={() => { setConfirmEmail(""); setShowDeleteDialog(true); }}
            className="shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
          >
            <Trash2 size={14} />
            Excluir conta
          </button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteDialog && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowDeleteDialog(false)}
        >
          <div
            className="bg-white rounded-[14px] shadow-card w-full max-w-md p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon + title */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 size={18} className="text-red-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Excluir conta</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Esta aÃ§Ã£o Ã© <strong>permanente e irreversÃ­vel</strong>. Todos os seus lanÃ§amentos,
                  categorias, recorrÃªncias e configuraÃ§Ãµes serÃ£o apagados.
                </p>
              </div>
            </div>

            {/* Email confirmation */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-medium text-slate-600">
                Para confirmar, digite seu e-mail: <span className="font-semibold text-slate-800">{user?.email}</span>
              </p>
              <input
                type="email"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                placeholder={user?.email}
                autoFocus
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteDialog(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!emailMatches || deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deleteMutation.isPending ? "Excluindo..." : "Excluir permanentemente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
