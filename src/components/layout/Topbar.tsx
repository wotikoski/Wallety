"use client";

import { useActiveGroup } from "@/lib/hooks/useActiveGroup";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Users } from "lucide-react";
import { useState } from "react";

interface Group {
  id: string;
  name: string;
  role: string;
}

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
    <header className="h-14 bg-white border-b border-app-border flex items-center px-5 gap-4 no-print">
      <div className="relative">
        <button
          onClick={() => setShowGroupMenu(!showGroupMenu)}
          className="flex items-center gap-2 text-[13px] font-medium text-slate-700 hover:text-slate-900 bg-[#f7f8fc] hover:bg-[#f0f2f8] px-3 py-1.5 rounded-[10px] border border-app-border transition"
        >
          <Users size={14} className="text-slate-400" />
          <span>{activeGroup ? activeGroup.name : "Pessoal"}</span>
          <ChevronDown size={14} className="text-slate-400" />
        </button>

        {showGroupMenu && (
          <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-slate-100 rounded-xl shadow-lg z-50 py-1">
            <button
              onClick={() => { setActiveGroupId(null); setShowGroupMenu(false); }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition ${!activeGroupId ? "text-brand-600 font-medium" : "text-slate-700"}`}
            >
              Pessoal
            </button>
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => { setActiveGroupId(g.id); setShowGroupMenu(false); }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition ${activeGroupId === g.id ? "text-brand-600 font-medium" : "text-slate-700"}`}
              >
                {g.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1" />

      <span className="text-xs text-app-muted font-medium">
        {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
      </span>
    </header>
  );
}
