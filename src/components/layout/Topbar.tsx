"use client";

import { useActiveGroup } from "@/lib/hooks/useActiveGroup";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Users } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";

interface Group {
  id: string;
  name: string;
  role: string;
}

const dateLabel = new Date().toLocaleDateString("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
}); // e.g. "sexta-feira, 24 de abril" — pt-BR is already lowercase

export function Topbar() {
  const { activeGroupId, setActiveGroupId } = useActiveGroup();
  const [showGroupMenu, setShowGroupMenu] = useState(false);

  const { data } = useQuery<{ groups: Group[] }>({
    queryKey: ["groups"],
    queryFn: () => fetch("/api/groups").then((r) => r.json()),
  });

  const groups = data?.groups ?? [];
  const activeGroup = groups.find((g) => g.id === activeGroupId);

  return (
    <header className="sticky top-0 z-30 h-14 bg-white border-b border-app-border flex items-center px-5 gap-3 no-print shrink-0">
      {/* Group selector */}
      <div className="relative">
        <button
          onClick={() => setShowGroupMenu(!showGroupMenu)}
          className="flex items-center gap-2 text-[13px] font-semibold text-app-text bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] px-3 py-1.5 rounded-[10px] border border-app-border transition"
        >
          <Users size={14} className="text-app-muted" />
          <span>{activeGroup ? activeGroup.name : "Pessoal"}</span>
          <ChevronDown size={13} className="text-app-muted" />
        </button>

        {showGroupMenu && (
          <div className="absolute top-full left-0 mt-1.5 w-52 bg-white border border-app-border rounded-[14px] shadow-card z-50 py-1.5 overflow-hidden">
            <button
              onClick={() => { setActiveGroupId(null); setShowGroupMenu(false); }}
              className={`w-full text-left px-4 py-2.5 text-[13px] hover:bg-[var(--surface-raised)] transition ${!activeGroupId ? "text-brand-500 font-semibold" : "text-app-text font-medium"}`}
            >
              Pessoal
            </button>
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => { setActiveGroupId(g.id); setShowGroupMenu(false); }}
                className={`w-full text-left px-4 py-2.5 text-[13px] hover:bg-[var(--surface-raised)] transition ${activeGroupId === g.id ? "text-brand-500 font-semibold" : "text-app-text font-medium"}`}
              >
                {g.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1" />

      <span className="text-[12px] text-app-muted font-medium">
        {dateLabel}
      </span>

      <ThemeToggle />
    </header>
  );
}
