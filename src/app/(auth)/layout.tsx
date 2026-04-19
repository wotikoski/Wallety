import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAccessToken, verifyRefreshToken } from "@/lib/auth/jwt";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Acesse sua conta",
};

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (accessToken) {
    try {
      await verifyAccessToken(accessToken);
      redirect("/dashboard");
    } catch {
      // expired, try refresh
    }
  }

  if (refreshToken) {
    try {
      const payload = await verifyRefreshToken(refreshToken);
      if (payload.sub) {
        redirect("/dashboard");
      }
    } catch {
      // invalid
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Wallety" className="w-10 h-10 rounded-xl block shrink-0" />
            <span className="text-2xl font-bold text-white tracking-tight">Wallety</span>
          </div>
          <p className="text-brand-200 text-sm">Sua vida financeira, simplificada.</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
