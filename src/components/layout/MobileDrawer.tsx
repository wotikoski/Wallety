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
  RefreshCcw,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

// Main items that don't fit on the 4-slot bottom nav. Same frequency
// order as the desktop sidebar: data entry → planning → analysis.
const mainDrawerItems = [
  { href: "/recorrencias", label: "Recorrências", icon: RefreshCcw },
  { href: "/limite-diario", label: "Limite Diário", icon: Target },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
];

// Settings, in setup-flow order — mirrors the desktop sidebar.
const configDrawerItems = [
  { href: "/categorias", label: "Categorias", icon: Tag },
  { href: "/formas-pagamento", label: "Formas de Pagamento", icon: CreditCard },
  { href: "/bancos", label: "Bancos", icon: Building2 },
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
      <div className="fixed bottom-0 left-0 right-0 bg-sidebar-bg rounded-t-2xl z-50 md:hidden pb-safe max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] sticky top-0 bg-sidebar-bg">
          <div className="flex items-center gap-3">
            <img src="/logo-white.png" alt="Wallety" className="w-8 h-8 rounded-xl block shrink-0" />
            <span className="font-brand text-white font-bold text-lg">Wallety</span>
          </div>
          <button onClick={onClose} className="text-white/40 p-1">
            <X size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {mainDrawerItems.map((item) => (
            <DrawerItem key={item.href} item={item} pathname={pathname} onClose={onClose} />
          ))}
        </nav>

        <div className="px-4 pb-2 pt-3 border-t border-white/[0.06]">
          <p className="text-slate-500 text-xs font-medium px-3 mb-2 uppercase tracking-wider">
            Configurações
          </p>
          <nav className="space-y-1">
            {configDrawerItems.map((item) => (
              <DrawerItem key={item.href} item={item} pathname={pathname} onClose={onClose} />
            ))}
          </nav>
        </div>

        <div className="px-4 pb-6 border-t border-white/[0.06] pt-3 mt-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-white/40 text-sm"
          >
            <LogOut size={18} />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </>
  );
}

function DrawerItem({
  item,
  pathname,
  onClose,
}: {
  item: { href: string; label: string; icon: React.ComponentType<{ size?: number }> };
  pathname: string;
  onClose: () => void;
}) {
  const active = pathname === item.href || pathname.startsWith(item.href + "/");
  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={cn(
        "flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition",
        active ? "bg-[rgba(97,115,244,0.18)] text-[#818cf8] font-semibold" : "text-white/40",
      )}
    >
      <item.icon size={18} />
      <span>{item.label}</span>
    </Link>
  );
}
