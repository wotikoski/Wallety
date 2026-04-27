import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[100dvh] bg-app-bg">
      <Sidebar />
      {/*
        Both mobile and desktop: the inner <main> is the scroll container.
        The bottom nav sits in the flex column below <main> — never overlaps content.
      */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto overscroll-y-contain">
          <div className="px-4 py-5 md:px-6 max-w-5xl mx-auto pb-4 md:pb-6">
            {children}
          </div>
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}