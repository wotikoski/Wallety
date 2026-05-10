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
  PiggyBank,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

// Main items that don't fit on the 4-slot bottom nav.
const mainDrawerItems = [
  { href: "/recorrencias", label: "Recorrências", icon: RefreshCcw },
  { href: "/metas", label: "Metas", icon: PiggyBank },
  { href: "/limite-diario", label: "Limite Diário", icon: Target },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
];

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
        className="fixed inset-0 bg-black/70 z-50 md:hidden"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 bg-sidebar-bg rounded-t-2xl z-50 md:hidden pb-safe max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07] sticky top-0 bg-sidebar-bg">
          <img src="/logo-white.png" alt="Wallety" className="h-7 w-auto block" />
          <button onClick={onClose} className="text-white/35 hover:text-white/60 p-1 transition">
            <X size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-0.5">
          {mainDrawerItems.map((item) => (
            <DrawerItem key={item.href} item={item} pathname={pathname} onClose={onClose} />
          ))}
        </nav>

        <div className="px-4 pb-2 pt-3 border-t border-white/[0.07]">
          <p className="text-white/20 text-[10px] font-semibold px-3 mb-2 uppercase tracking-[0.12em]">
            Configurações
          </p>
          <nav className="space-y-0.5">
            {configDrawerItems.map((item) => (
              <DrawerItem key={item.href} item={item} pathname={pathname} onClose={onClose} />
            ))}
          </nav>
        </div>

        <div className="px-4 pb-5 border-t border-white/[0.07] pt-2 mt-1">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-2.5 py-2 rounded-[8px] text-white/30 text-[12px] tracking-wide hover:text-white/55 hover:bg-white/[0.05] transition"
          >
            <LogOut size={13} />
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
        "flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13px] font-medium tracking-wide transition",
        active
          ? "bg-[rgba(59,130,246,0.15)] text-[#3b82f6] font-semibold"
          : "text-white/35 hover:text-white/65 hover:bg-white/[0.05]",
      )}
    >
      <item.icon size={16} />
      <span>{item.label}</span>
    </Link>
  );
}
