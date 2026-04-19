"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Tag,
  Building2,
  CreditCard,
  Users,
  User,
  LogOut,
  X,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const drawerItems = [
  { href: "/limite-diario", label: "Limite Diário", icon: Target },
  { href: "/categorias", label: "Categorias", icon: Tag },
  { href: "/bancos", label: "Bancos", icon: Building2 },
  { href: "/formas-pagamento", label: "Formas de Pagamento", icon: CreditCard },
  { href: "/grupos", label: "Grupos", icon: Users },
  { href: "/perfil", label: "Meu Perfil", icon: User },
];

async function handleLogout() {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/login";
}

export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-50 md:hidden"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 bg-slate-950 rounded-t-2xl z-50 md:hidden pb-safe">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Wallety" className="w-8 h-8 rounded-xl block shrink-0" />
            <span className="text-white font-bold">Wallety</span>
          </div>
          <button onClick={onClose} className="text-slate-400 p-1">
            <X size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {drawerItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition",
                  active
                    ? "bg-brand-600/20 text-brand-400 font-medium"
                    : "text-slate-400"
                )}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 pb-6 border-t border-slate-800 pt-3">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-slate-400 text-sm"
          >
            <LogOut size={18} />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </>
  );
}
