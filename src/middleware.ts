import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, verifyRefreshToken, signAccessToken } from "@/lib/auth/jwt";

const PUBLIC_PATHS = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/opengraph-image",
  "/termos",
  "/privacidade",
];

const AUTH_PATHS = ["/login", "/register"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // --- CSRF defense: Origin header check for state-changing API requests ---
  // Browsers always send Origin on POST/PUT/PATCH/DELETE from fetch/XHR. We
  // reject when the Origin doesn't match the request host. SameSite=lax
  // cookies already block top-level cross-site POSTs, so this is a second
  // layer against fetch-based CSRF from embedded/malicious contexts.
  if (pathname.startsWith("/api/") && ["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    if (origin) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return NextResponse.json({ error: "Origem não autorizada" }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ error: "Origem inválida" }, { status: 403 });
      }
    }
    // Some same-origin fetches don't set Origin (rare; older browsers). Fall
    // through to auth check — SameSite cookies still apply there.
  }

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
      const cookieDomain = process.env.COOKIE_DOMAIN;

      // Rewrite the Cookie header in the forwarded request so that route
      // handlers (which read from req.cookies, not from the response) see the
      // fresh access token instead of the expired one.
      const reqHeaders = new Headers(req.headers);
      const existing = reqHeaders.get("cookie") ?? "";
      const updated = existing.replace(/\baccess_token=[^;]*/g, "").replace(/;{2,}/g, ";").replace(/^;|;$/g, "").trim();
      reqHeaders.set("cookie", updated ? `${updated}; access_token=${newAccessToken}` : `access_token=${newAccessToken}`);

      const response = NextResponse.next({ request: { headers: reqHeaders } });
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
  const cookieDomain = process.env.COOKIE_DOMAIN;
  const expireOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 0,
    path: "/",
    ...(cookieDomain && { domain: cookieDomain }),
  };
  response.cookies.set("access_token", "", expireOptions);
  response.cookies.set("refresh_token", "", expireOptions);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff|woff2)).*)"],
};
