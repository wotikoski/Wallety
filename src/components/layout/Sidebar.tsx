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
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/lancamentos", label: "Lançamentos", icon: ArrowLeftRight },
  { href: "/calendario", label: "Calendário", icon: Calendar },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/limite-diario", label: "Limite Diário", icon: Target },
];

const configItems = [
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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 bg-slate-950 flex-col h-screen sticky top-0 shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Wallety" className="w-9 h-9 rounded-xl block shrink-0" />
          <div>
            <div className="text-white font-bold text-lg leading-none">Wallety</div>
            <div className="text-slate-400 text-xs mt-0.5">Finanças simplificadas</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="mb-4">
          {navItems.map((item) => (
            <NavItem key={item.href} {...item} active={pathname === item.href || pathname.startsWith(item.href + "/")} />
          ))}
        </div>

        <div className="pt-4 border-t border-slate-800">
          <p className="text-slate-500 text-xs font-medium px-3 mb-2 uppercase tracking-wider">Configurações</p>
          {configItems.map((item) => (
            <NavItem key={item.href} {...item} active={pathname === item.href || pathname.startsWith(item.href + "/")} />
          ))}
        </div>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition text-sm"
        >
          <LogOut size={16} />
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
  icon: React.ComponentType<{ size?: number; className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
        active
          ? "bg-brand-600/20 text-brand-400 font-medium"
          : "text-slate-400 hover:text-white hover:bg-slate-800/60",
      )}
    >
      <Icon size={16} className={active ? "text-brand-400" : ""} />
      <span>{label}</span>
    </Link>
  );
}
