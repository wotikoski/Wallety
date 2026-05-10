"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { FileText, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { Portal } from "@/components/ui/Portal";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { formInputCls, formLabelCls } from "@/components/ui/FormModal";

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
    queryFn: () => fetch("/api/users/me").then((r) => { if (!r.ok) { return r.json().then((b) => { throw new Error(b?.error ?? `API ${r.status}`); }); } return r.json(); }),
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

  if (isLoading) return <div className="text-[var(--text-mute)] text-sm">Carregando...</div>;

  return (
    <div className="space-y-6 max-w-lg animate-fade-in">
      <PageHeader
        title="Meu Perfil"
        subtitle="Gerencie suas informações pessoais"
      />

      {/* Profile form */}
      <div className="bg-[var(--surface-card)] rounded-[14px] border border-[var(--color-border)] p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[var(--color-border)]">
          <div className="w-16 h-16 rounded-[14px] bg-[rgba(59,130,246,.12)] flex items-center justify-center text-2xl font-bold text-[#3b82f6]">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-[15px] font-semibold text-[var(--color-text)]">{user?.name}</p>
            <p className="text-[13px] text-[var(--text-mute)]">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} className="space-y-4">
          <div>
            <label className={formLabelCls}>Nome completo</label>
            <input
              {...register("name", { required: true })}
              className={formInputCls}
            />
          </div>
          <div>
            <label className={formLabelCls}>E-mail</label>
            <input
              value={user?.email}
              disabled
              className={`${formInputCls} opacity-50 cursor-not-allowed`}
            />
            <p className="text-[11px] text-[var(--text-mute)] mt-1.5">O e-mail não pode ser alterado</p>
          </div>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold py-[9px] px-4 rounded-[10px] text-[13px] transition disabled:opacity-50"
          >
            {updateMutation.isPending ? "Salvando..." : "Salvar alterações"}
          </button>
        </form>
      </div>

      {/* Legal */}
      <div className="bg-[var(--surface-card)] rounded-[14px] border border-[var(--color-border)] overflow-hidden">
        <div className="px-6 py-3.5 border-b border-[var(--color-border)]">
          <h2 className="text-[13px] font-semibold text-[var(--color-text)]">Legal</h2>
        </div>
        <div className="divide-y divide-[var(--color-border)]">
          <Link
            href="/termos"
            target="_blank"
            className="flex items-center gap-3 px-6 py-4 hover:bg-[var(--surface-raised)] transition"
          >
            <FileText size={16} className="text-[var(--text-mute)] shrink-0" />
            <div className="flex-1">
              <p className="text-[13px] font-medium text-[var(--color-text)]">Termos de Uso</p>
              <p className="text-[11px] text-[var(--text-mute)]">Última atualização: 21 de abril de 2026</p>
            </div>
            <span className="text-[var(--text-mute)] text-sm">›</span>
          </Link>
          <Link
            href="/privacidade"
            target="_blank"
            className="flex items-center gap-3 px-6 py-4 hover:bg-[var(--surface-raised)] transition"
          >
            <ShieldCheck size={16} className="text-[var(--text-mute)] shrink-0" />
            <div className="flex-1">
              <p className="text-[13px] font-medium text-[var(--color-text)]">Política de Privacidade</p>
              <p className="text-[11px] text-[var(--text-mute)]">Conforme a LGPD – Lei nº 13.709/2018</p>
            </div>
            <span className="text-[var(--text-mute)] text-sm">›</span>
          </Link>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-[var(--surface-card)] rounded-[14px] border border-[var(--color-border)] overflow-hidden">
        <div className="px-6 py-3.5 border-b border-[var(--color-border)]">
          <h2 className="text-[13px] font-semibold text-[#ef4444]">Zona de Perigo</h2>
        </div>
        <div className="px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-[13px] font-medium text-[var(--color-text)]">Excluir minha conta</p>
            <p className="text-[11px] text-[var(--text-mute)] mt-0.5">
              Todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita.
            </p>
          </div>
          <button
            onClick={() => { setConfirmEmail(""); setShowDeleteDialog(true); }}
            className="shrink-0 inline-flex items-center gap-2 py-[9px] px-4 text-[13px] font-semibold text-[#ef4444] border border-[var(--color-border)] rounded-[10px] hover:bg-[rgba(239,68,68,.08)] transition"
          >
            <Trash2 size={14} />
            Excluir conta
          </button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteDialog && (
        <Portal>
          <div
            className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[6px] flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setShowDeleteDialog(false)}
          >
            <div
              className="bg-[var(--surface-card)] rounded-[14px] border border-[var(--color-border)] w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start gap-4 p-6">
                <div className="w-10 h-10 rounded-full bg-[rgba(239,68,68,.12)] flex items-center justify-center shrink-0">
                  <Trash2 size={18} className="text-[#ef4444]" />
                </div>
                <div className="flex-1">
                  <h2 className="text-[15px] font-semibold text-[var(--color-text)]">Excluir conta</h2>
                  <p className="text-[13px] text-[var(--text-mute)] mt-1 leading-relaxed">
                    Esta ação é <strong>permanente e irreversível</strong>. Todos os seus lançamentos,
                    categorias, recorrências e configurações serão apagados.
                  </p>
                </div>
              </div>

              {/* Email confirmation */}
              <div className="px-6 pb-4 space-y-2">
                <label className={formLabelCls}>
                  Confirme digitando seu e-mail:{" "}
                  <span className="normal-case text-[var(--color-text)]">{user?.email}</span>
                </label>
                <input
                  type="email"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  placeholder={user?.email}
                  autoFocus
                  className={formInputCls}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setShowDeleteDialog(false)}
                  className="h-[42px] px-5 rounded-[10px] border border-[var(--color-border)] text-[13px] font-semibold text-[var(--text-mute)] hover:bg-[var(--surface-raised)] hover:text-[var(--color-text)] transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!emailMatches || deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate()}
                  className="h-[42px] px-5 rounded-[10px] text-[13px] font-semibold text-white bg-[#ef4444] hover:bg-[#dc2626] transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {deleteMutation.isPending ? "Excluindo..." : "Excluir permanentemente"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
