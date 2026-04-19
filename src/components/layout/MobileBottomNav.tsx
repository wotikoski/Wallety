"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Calendar,
  BarChart3,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useState } from "react";
import { MobileDrawer } from "./MobileDrawer";

const mainItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/lancamentos", label: "Lançamentos", icon: ArrowLeftRight },
  { href: "/calendario", label: "Calendário", icon: Calendar },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 z-40 flex">
        {mainItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition",
                active ? "text-brand-400" : "text-slate-400"
              )}
            >
              <item.icon size={20} />
              <span className="text-[10px] font-medium">{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-slate-400"
        >
          <Menu size={20} />
          <span className="text-[10px] font-medium">Mais</span>
        </button>
      </nav>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
