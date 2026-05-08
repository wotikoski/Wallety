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
      <nav
        className="md:hidden shrink-0 bg-sidebar-bg border-t border-white/[0.07] z-40 flex"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)", minHeight: "4rem" }}
      >
        {mainItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition",
                active ? "text-[#3b82f6]" : "text-white/30 hover:text-white/55"
              )}
            >
              <item.icon size={19} strokeWidth={active ? 2 : 1.75} />
              <span className="text-[10px] font-medium tracking-wide">{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-white/30 hover:text-white/55 transition"
        >
          <Menu size={19} strokeWidth={1.75} />
          <span className="text-[10px] font-medium tracking-wide">Mais</span>
        </button>
      </nav>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
