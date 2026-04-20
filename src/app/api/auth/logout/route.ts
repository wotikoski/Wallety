import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  const cookieDomain = process.env.COOKIE_DOMAIN;

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 0,
    path: "/",
    ...(cookieDomain && { domain: cookieDomain }),
  };

  response.cookies.set("access_token", "", cookieOptions);
  response.cookies.set("refresh_token", "", cookieOptions);

  return response;
}
