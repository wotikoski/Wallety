"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActiveGroup } from "@/lib/hooks/useActiveGroup";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useConfirm } from "@/lib/hooks/useConfirm";
import { Plus, Users, Crown, Trash2, UserPlus, Copy, Check } from "lucide-react";
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
    queryFn: () => fetch("/api/groups").then((r) => r.json()),
  });

  const { data: memberData } = useQuery<{ group: Group; members: Member[] }>({
    queryKey: ["group-detail", selectedGroup],
    queryFn: () => fetch(`/api/groups/${selectedGroup}`).then((r) => r.json()),
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold text-app-text tracking-tight">Grupos</h1>
          <p className="text-app-muted text-[13px] mt-0.5 font-medium">Compartilhe finanças com família ou parceiros</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          title="Novo Grupo"
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-700 text-white text-sm font-medium px-3.5 h-9 rounded-lg transition"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Novo Grupo</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-[14px] border border-app-border p-5 shadow-card">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Criar Grupo</h2>
          <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome do grupo</label>
              <input
                {...register("name", { required: true })}
                className="w-full h-9 px-3.5 rounded-lg border border-app-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Ex: Família Silva"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Descrição (opcional)</label>
              <input
                {...register("description")}
                className="w-full h-9 px-3.5 rounded-lg border border-app-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Breve descrição do grupo"
              />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 h-9 px-4 border border-app-border text-slate-600 rounded-lg text-sm hover:bg-[var(--surface-raised)] transition">Cancelar</button>
              <button type="submit" disabled={createMutation.isPending} className="flex-1 h-9 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 rounded-lg transition disabled:opacity-50">
                {createMutation.isPending ? "Criando..." : "Criar Grupo"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Groups list */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Meus grupos</p>
          {groups.length === 0 ? (
            <div className="bg-white rounded-[14px] border border-app-border p-8 text-center shadow-card">
              <Users size={32} className="text-slate-300 mx-auto mb-2" />
              <p className="text-[13px] text-app-muted">Nenhum grupo ainda</p>
            </div>
          ) : (
            groups.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGroup(g.id === selectedGroup ? null : g.id)}
                className={`w-full text-left bg-white rounded-xl border p-4 shadow-sm transition ${g.id === selectedGroup ? "border-brand-300 ring-1 ring-brand-300" : "border-app-border hover:border-brand-300"}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center shrink-0">
                    <Users size={18} className="text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{g.name}</p>
                    <p className="text-[11px] text-app-muted capitalize">{g.role === "owner" ? "Dono" : g.role}</p>
                  </div>
                  {activeGroupId === g.id && (
                    <span className="text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full font-medium">Ativo</span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Group detail */}
        {selectedGroup && currentGroup && (
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-[14px] border border-app-border p-5 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-slate-800">{currentGroup.name}</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveGroupId(activeGroupId === selectedGroup ? null : selectedGroup)}
                    className={`text-xs px-3 h-9 rounded-lg font-medium transition ${activeGroupId === selectedGroup ? "bg-brand-600 text-white" : "border border-brand-300 text-brand-600 hover:bg-brand-50"}`}
                  >
                    {activeGroupId === selectedGroup ? "Ativo" : "Ativar"}
                  </button>
                  {currentGroup.role === "owner" && (
                    <button
                      onClick={() => confirm(() => deleteMutation.mutate(selectedGroup), {
                      title: "Excluir grupo",
                      description: `Tem certeza que deseja excluir o grupo "${currentGroup.name}"? Todos os lançamentos, categorias e dados compartilhados serão perdidos.`,
                      confirmLabel: "Excluir",
                    })}
                      className="p-1.5 text-app-muted hover:text-expense hover:bg-[rgba(248,113,113,.1)] rounded-lg transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              <h3 className="text-sm font-medium text-slate-600 mb-3">Membros ({members.length})</h3>
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.user.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50">
                    <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-sm font-semibold text-brand-700 shrink-0">
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
            <div className="bg-white rounded-[14px] border border-app-border p-5 shadow-card">
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Convidar membro</h3>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="flex-1 h-9 px-3.5 rounded-lg border border-app-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  onClick={() => inviteMutation.mutate()}
                  disabled={!inviteEmail || inviteMutation.isPending}
                  className="flex items-center gap-1.5 bg-brand-500 hover:bg-brand-700 text-white text-sm font-medium px-4 h-9 rounded-lg transition disabled:opacity-50"
                >
                  <UserPlus size={14} />
                  Convidar
                </button>
              </div>

              {inviteUrl && (
                <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1.5">Link de convite (válido por 7 dias):</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-slate-700 flex-1 truncate">{inviteUrl}</code>
                    <button onClick={copyInviteUrl} className="p-1.5 text-slate-400 hover:text-brand-600 transition">
                      {copied ? <Check size={14} className="text-income" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog {...dialogProps} loading={deleteMutation.isPending} />
    </div>
  );
}
