import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  const cookieDomain = process.env.COOKIE_DOMAIN;
  const isProd = process.env.NODE_ENV === "production";
  const secureAttr = isProd ? "; Secure" : "";

  // Browsers match Set-Cookie deletion by (name, domain, path). Old sessions
  // (from before COOKIE_DOMAIN was configured) produced *host-only* cookies
  // that never get cleared by a domain-scoped delete, so they keep being sent
  // on the subdomain the user originally logged in from — making logout
  // appear to fail. Emit BOTH variants: host-only AND domain-scoped.
  const expired = "Max-Age=0; Path=/; HttpOnly; SameSite=Lax" + secureAttr;

  const headers: string[] = [];
  for (const name of ["access_token", "refresh_token"]) {
    // Host-only (clears legacy cookies)
    headers.push(`${name}=; ${expired}`);
    // Domain-scoped (clears current cookies)
    if (cookieDomain) {
      headers.push(`${name}=; ${expired}; Domain=${cookieDomain}`);
    }
  }

  for (const h of headers) response.headers.append("Set-Cookie", h);

  return response;
}
