"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { GroupsClient } from "./GroupsClient";

export function GroupDetailClient({ id }: { id: string }) {
  return (
    <div>
      <Link href="/grupos" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-app-text mb-6 transition">
        <ArrowLeft size={14} />
        Voltar para grupos
      </Link>
      <GroupsClient />
    </div>
  );
}
