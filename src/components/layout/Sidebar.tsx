"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Calendar,
  BarChart3,
  Target,
  Tag,
  Building2,
  CreditCard,
  Users,
  User,
  LogOut,
  Wallet,
  RefreshCcw,
  PiggyBank,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/lancamentos", label: "Lançamentos", icon: ArrowLeftRight },
  { href: "/recorrencias", label: "Recorrências", icon: RefreshCcw },
  { href: "/calendario", label: "Calendário", icon: Calendar },
  { href: "/orcamentos", label: "Orçamentos", icon: Wallet },
  { href: "/metas", label: "Metas", icon: PiggyBank },
  { href: "/limite-diario", label: "Limite Diário", icon: Target },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
];

const configItems = [
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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-60 bg-sidebar-bg flex-col h-screen sticky top-0 shrink-0 overflow-x-hidden">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-white/[0.07] shrink-0">
        <img src="/logo-white.png" alt="Wallety" className="h-8 w-auto block" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pt-3 pb-2 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="mb-2">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              active={pathname === item.href || pathname.startsWith(item.href + "/")}
            />
          ))}
        </div>

        <div className="pt-4 border-t border-white/[0.07]">
          <p className="text-[10px] font-semibold text-white/20 uppercase tracking-[0.12em] px-2.5 pb-2">
            Configurações
          </p>
          {configItems.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              active={pathname === item.href || pathname.startsWith(item.href + "/")}
            />
          ))}
        </div>
      </nav>

      {/* Logout */}
      <div className="h-14 flex items-center px-3 border-t border-white/[0.07] shrink-0">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition text-[13px] font-medium tracking-wide"
        >
          <LogOut size={14} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "relative flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-[13px] transition-all mb-0.5 tracking-wide",
        active
          ? "bg-[rgba(59,130,246,0.15)] text-[#3b82f6] font-semibold"
          : "text-white/35 hover:text-white/65 hover:bg-white/[0.05] font-medium",
      )}
    >
      {/* Active left indicator */}
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[16px] bg-[#3b82f6] rounded-r-full" />
      )}
      <Icon size={14} strokeWidth={active ? 2 : 1.75} />
      <span className="truncate">{label}</span>
    </Link>
  );
}
