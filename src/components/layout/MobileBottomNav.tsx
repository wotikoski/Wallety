"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Calendar,
  Wallet,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useState } from "react";
import { MobileDrawer } from "./MobileDrawer";

// Four thumb-reach slots for the daily loop ("is my month ok?"):
// overview → log → see when → check budget. Relatórios moves into "Mais".
const mainItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/lancamentos", label: "Lançamentos", icon: ArrowLeftRight },
  { href: "/calendario", label: "Calendário", icon: Calendar },
  { href: "/orcamentos", label: "Orçamentos", icon: Wallet },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-sidebar-bg border-t border-white/[0.06] z-40 flex h-16">
        {mainItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition",
                active ? "text-[#818cf8]" : "text-white/35"
              )}
            >
              <item.icon size={20} />
              <span className="text-[10px] font-medium">{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-white/35"
        >
          <Menu size={20} />
          <span className="text-[10px] font-medium">Mais</span>
        </button>
      </nav>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
