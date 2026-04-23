import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAccessToken, verifyRefreshToken } from "@/lib/auth/jwt";
import { BackgroundCanvas } from "@/components/auth/BackgroundCanvas";

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
    <div style={{ minHeight: "100vh", background: "#0b1120", overflow: "hidden" }}>
      <BackgroundCanvas />

      {/* Noise overlay */}
      <div
        style={{
          position: "fixed", inset: 0, pointerEvents: "none", opacity: 0.025, zIndex: 1,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 2, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ width: "100%", maxWidth: "400px" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px", justifyContent: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-white.png" alt="Wallety" style={{ width: "38px", height: "38px", borderRadius: "10px", display: "block" }} />
            <span className="font-brand" style={{ fontSize: "26px", fontWeight: 700, color: "#e2e8f0", letterSpacing: "-0.02em" }}>
              Wallety
            </span>
          </div>

          {/* Card */}
          <div style={{
            background: "rgba(13,21,38,0.72)",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            border: "1px solid rgba(59,130,246,0.18)",
            borderRadius: "20px",
            padding: "40px 36px",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.04) inset, 0 32px 80px rgba(0,0,0,0.5), 0 0 60px rgba(59,130,246,0.06)",
          }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
