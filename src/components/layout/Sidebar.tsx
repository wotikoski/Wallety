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
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/lancamentos", label: "Lançamentos", icon: ArrowLeftRight },
  { href: "/recorrencias", label: "Recorrências", icon: RefreshCcw },
  { href: "/calendario", label: "Calendário", icon: Calendar },
  { href: "/orcamentos", label: "Orçamentos", icon: Wallet },
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
      <div className="h-14 flex items-center px-5 border-b border-[#2B284F] shrink-0">
        <img src="/logo-white.png" alt="Wallety" className="h-8 w-auto block" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pt-3 pb-2 overflow-y-auto">
        <div className="mb-2">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              active={pathname === item.href || pathname.startsWith(item.href + "/")}
            />
          ))}
        </div>

        <div className="pt-4 border-t border-[#2B284F]">
          <p className="text-[10px] font-bold text-white/25 uppercase tracking-[0.1em] px-2.5 pb-2">
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
      <div className="h-14 flex items-center px-3 border-t border-[#2B284F] shrink-0">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-[10px] text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition text-[13px] font-medium"
        >
          <LogOut size={15} />
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
        "relative flex items-center gap-2.5 w-full px-2.5 py-2 rounded-[10px] text-[13px] transition-all mb-0.5",
        active
          ? "bg-[rgba(123,117,212,0.18)] text-[#7B75D4] font-semibold"
          : "text-white/40 hover:text-white/70 hover:bg-white/[0.05] font-medium",
      )}
    >
      {/* Active left indicator bar */}
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] bg-[#7B75D4] rounded-r-[3px]" />
      )}
      <Icon size={15} strokeWidth={active ? 2 : 1.75} />
      <span className="truncate">{label}</span>
    </Link>
  );
}
