import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] md:h-[100dvh] bg-app-bg">
      <Sidebar />
      {/*
        Mobile: body scrolls naturally (most reliable on iOS/Safari).
          – Topbar is sticky so it stays visible while scrolling.
          – pb-36 clears bottom nav (64px) + FAB (56px) + breathing room.
        Desktop: the inner <main> is the scroll container (unchanged).
      */}
      <div className="flex-1 flex flex-col min-w-0 md:overflow-hidden">
        <Topbar />
        <main className="flex-1 md:overflow-y-auto md:overscroll-y-contain">
          <div className="px-4 py-5 md:px-6 max-w-5xl mx-auto pb-36 md:pb-6">
            {children}
          </div>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
