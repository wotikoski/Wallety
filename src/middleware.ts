import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, verifyRefreshToken, signAccessToken } from "@/lib/auth/jwt";

const PUBLIC_PATHS = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/opengraph-image",
];

const AUTH_PATHS = ["/login", "/register"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow static/public API routes
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const accessToken = req.cookies.get("access_token")?.value;
  const refreshToken = req.cookies.get("refresh_token")?.value;

  // --- Determine auth state ---
  let isAuthenticated = false;
  let pendingRefresh: { sub: string; email: string; name: string } | null = null;

  // 1. Try access token
  if (accessToken) {
    try {
      await verifyAccessToken(accessToken);
      isAuthenticated = true;
    } catch {
      // Expired — try refresh below
    }
  }

  // 2. Try refresh token
  if (!isAuthenticated && refreshToken) {
    try {
      const payload = await verifyRefreshToken(refreshToken);
      if (payload.sub && payload.email && payload.name) {
        isAuthenticated = true;
        pendingRefresh = {
          sub: payload.sub,
          email: payload.email,
          name: payload.name,
        };
      }
    } catch {
      // Refresh token invalid or expired
    }
  }

  // --- Routing decisions ---

  // Authenticated user visiting login/register → send to dashboard
  if (isAuthenticated && AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Unauthenticated user visiting login/register → allow
  if (AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Root → dashboard
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Authenticated → proceed (and renew access token if needed)
  if (isAuthenticated) {
    if (pendingRefresh) {
      const newAccessToken = await signAccessToken(pendingRefresh);
      const response = NextResponse.next();
      const cookieDomain = process.env.COOKIE_DOMAIN;
      response.cookies.set("access_token", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60,
        path: "/",
        ...(cookieDomain && { domain: cookieDomain }),
      });
      return response;
    }
    return NextResponse.next();
  }

  // Not authenticated → redirect to login
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const response = NextResponse.redirect(new URL("/login", req.url));
  response.cookies.delete("access_token");
  response.cookies.delete("refresh_token");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff|woff2)).*)"],
};
