"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActiveGroup } from "@/lib/hooks/useActiveGroup";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useConfirm } from "@/lib/hooks/useConfirm";
import { Plus, Users, Crown, Trash2, UserPlus, Copy, Check } from "lucide-react";
import { PageHeader, PrimaryButton } from "@/components/layout/PageHeader";
import { FormModal, formInputCls, formLabelCls } from "@/components/ui/FormModal";
import Link from "next/link";
import { formatDate } from "@/lib/utils/date";

interface Group {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  role: string;
  createdAt: string;
}

interface Member {
  user: { id: string; name: string; email: string; avatarUrl: string | null };
  role: string;
  joinedAt: string;
}

export function GroupsClient() {
  const queryClient = useQueryClient();
  const { setActiveGroupId, activeGroupId } = useActiveGroup();
  const { toast } = useToast();
  const { confirm, dialogProps } = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: groupsData } = useQuery<{ groups: Group[] }>({
    queryKey: ["groups"],
    queryFn: () => fetch("/api/groups").then((r) => { if (!r.ok) { return r.json().then((b) => { throw new Error(b?.error ?? `API ${r.status}`); }); } return r.json(); }),
  });

  const { data: memberData } = useQuery<{ group: Group; members: Member[] }>({
    queryKey: ["group-detail", selectedGroup],
    queryFn: () => fetch(`/api/groups/${selectedGroup}`).then((r) => { if (!r.ok) { return r.json().then((b) => { throw new Error(b?.error ?? `API ${r.status}`); }); } return r.json(); }),
    enabled: !!selectedGroup,
  });

  const { register, handleSubmit, reset } = useForm<{ name: string; description: string }>();

  const createMutation = useMutation({
    mutationFn: async (d: { name: string; description: string }) => {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(d),
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({ title: "Grupo criado!" });
      reset();
      setShowForm(false);
      setSelectedGroup(data.group.id);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/groups/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir grupo");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({ title: "Grupo excluído" });
      setSelectedGroup(null);
    },
    onError: () => {
      toast({ title: "Erro ao excluir grupo", description: "Apenas o dono pode excluir o grupo.", variant: "destructive" });
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/groups/${selectedGroup}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      setInviteUrl(data.inviteUrl);
      setInviteEmail("");
      toast({ title: "Convite gerado!" });
    },
  });

  const groups = groupsData?.groups ?? [];
  const members = memberData?.members ?? [];
  const currentGroup = memberData?.group;

  async function copyInviteUrl() {
    if (inviteUrl) {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Grupos"
        subtitle="Compartilhe finanças com família ou parceiros"
        right={
          <PrimaryButton onClick={() => setShowForm(!showForm)}>
            <Plus size={15} />
            <span className="hidden sm:inline">Novo Grupo</span>
          </PrimaryButton>
        }
      />

      <FormModal
        open={showForm}
        title="Novo Grupo"
        onClose={() => { setShowForm(false); reset(); }}
        onSubmit={handleSubmit((d) => createMutation.mutate(d))}
        submitLabel="Criar grupo"
        submitting={createMutation.isPending}
        submittingLabel="Criando..."
      >
        <div>
          <label className={formLabelCls}>Nome do grupo</label>
          <input
            {...register("name", { required: true })}
            className={formInputCls}
            placeholder="Ex: Família Silva"
          />
        </div>
        <div>
          <label className={formLabelCls}>Descrição (opcional)</label>
          <input
            {...register("description")}
            className={formInputCls}
            placeholder="Breve descrição do grupo"
          />
        </div>
      </FormModal>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Groups list */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-app-muted uppercase tracking-wider">Meus grupos</p>
          {groups.length === 0 ? (
            <div className="bg-[var(--surface-card)] rounded-[14px] border border-[var(--color-border)] p-8 text-center">
              <Users size={32} className="text-[var(--text-faint,#cbd5e1)] mx-auto mb-2" />
              <p className="text-[13px] text-app-muted">Nenhum grupo ainda</p>
            </div>
          ) : (
            groups.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGroup(g.id === selectedGroup ? null : g.id)}
                className={`w-full text-left bg-[var(--surface-card)] rounded-[14px] border p-4 transition ${g.id === selectedGroup ? "border-[#3b82f6] ring-1 ring-[#3b82f6]" : "border-[var(--color-border)] hover:border-[#3b82f6]"}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[10px] bg-[rgba(59,130,246,.12)] flex items-center justify-center shrink-0">
                    <Users size={18} className="text-[#3b82f6]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-app-text truncate">{g.name}</p>
                    <p className="text-[11px] text-app-muted capitalize">{g.role === "owner" ? "Dono" : g.role}</p>
                  </div>
                  {activeGroupId === g.id && (
                    <span className="text-xs text-[#3b82f6] bg-[rgba(59,130,246,.10)] px-2 py-0.5 rounded-full font-medium">Ativo</span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Group detail */}
        {selectedGroup && currentGroup && (
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[var(--surface-card)] rounded-[14px] border border-[var(--color-border)] p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-semibold text-[var(--color-text)]">{currentGroup.name}</h2>
                <button
                  onClick={() => setActiveGroupId(activeGroupId === selectedGroup ? null : selectedGroup)}
                  className={`h-[38px] px-4 rounded-[10px] text-[13px] font-semibold transition ${activeGroupId === selectedGroup ? "bg-[#3b82f6] hover:bg-[#2563eb] text-white" : "border border-[var(--color-border)] text-[var(--text-mute)] hover:bg-[var(--surface-raised)] hover:text-[var(--color-text)]"}`}
                >
                  {activeGroupId === selectedGroup ? "Ativo" : "Ativar"}
                </button>
              </div>

              <h3 className="text-[11px] font-bold uppercase tracking-[0.07em] text-[var(--text-mute)] mb-3">Membros ({members.length})</h3>
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.user.id} className="flex items-center gap-3 p-2.5 rounded-[10px] bg-[var(--surface-raised)]">
                    <div className="w-8 h-8 rounded-[8px] bg-[rgba(59,130,246,.12)] flex items-center justify-center text-[13px] font-semibold text-[#3b82f6] shrink-0">
                      {m.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-app-text">{m.user.name}</p>
                      <p className="text-[11px] text-app-muted">{m.user.email}</p>
                    </div>
                    {m.role === "owner" && <Crown size={14} className="text-amber-500" />}
                    <span className="text-[11px] text-app-muted capitalize">{m.role === "owner" ? "Dono" : m.role === "admin" ? "Admin" : "Membro"}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Invite section */}
            <div className="bg-[var(--surface-card)] rounded-[14px] border border-[var(--color-border)] p-5">
              <h3 className="text-base font-semibold text-app-text mb-3">Convidar membro</h3>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="flex-1 h-[38px] px-3.5 rounded-[10px] border border-[var(--color-border)] text-[13px] bg-[var(--surface-raised)] text-[var(--color-text)] placeholder-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] transition"
                />
                <button
                  onClick={() => inviteMutation.mutate()}
                  disabled={!inviteEmail || inviteMutation.isPending}
                  className="inline-flex items-center gap-1.5 h-[38px] px-4 rounded-[10px] text-[13px] font-semibold text-white bg-[#3b82f6] hover:bg-[#2563eb] transition disabled:opacity-50"
                >
                  <UserPlus size={14} />
                  Convidar
                </button>
              </div>

              {inviteUrl && (
                <div className="mt-3 p-3 bg-[var(--surface-raised)] rounded-[10px]">
                  <p className="text-xs text-[var(--text-mute)] mb-1.5">Link de convite (válido por 7 dias):</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-app-text flex-1 truncate">{inviteUrl}</code>
                    <button onClick={copyInviteUrl} className="p-1.5 text-app-muted hover:text-[#3b82f6] transition">
                      {copied ? <Check size={14} className="text-income" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              )}
            </div>
            {/* Danger zone — owners only */}
            {currentGroup.role === "owner" && (
              <div className="bg-[var(--surface-card)] rounded-[14px] border border-[var(--color-border)] overflow-hidden">
                <div className="px-5 py-3.5 border-b border-[var(--color-border)]">
                  <h3 className="text-[13px] font-semibold text-[#ef4444]">Zona de Perigo</h3>
                </div>
                <div className="px-5 py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[13px] font-medium text-[var(--color-text)]">Excluir grupo</p>
                    <p className="text-[11px] text-[var(--text-mute)] mt-0.5">
                      Todos os dados compartilhados serão removidos permanentemente.
                    </p>
                  </div>
                  <button
                    onClick={() => confirm(() => deleteMutation.mutate(selectedGroup!), {
                      title: "Excluir grupo",
                      description: `Tem certeza que deseja excluir o grupo "${currentGroup.name}"? Todos os lançamentos, categorias e dados compartilhados serão perdidos permanentemente.`,
                      confirmLabel: "Excluir",
                    })}
                    className="shrink-0 inline-flex items-center gap-2 py-[9px] px-4 text-[13px] font-semibold text-[#ef4444] border border-[var(--color-border)] rounded-[10px] hover:bg-[rgba(239,68,68,.08)] transition"
                  >
                    <Trash2 size={14} />
                    Excluir grupo
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog {...dialogProps} loading={deleteMutation.isPending} />
    </div>
  );
}
