import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/auth/middleware";
import { AuthError } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { users, refreshTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const [user] = await db
      .select({ id: users.id, name: users.name, email: users.email, avatarUrl: users.avatarUrl, createdAt: users.createdAt })
      .from(users)
      .where(eq(users.id, auth.sub))
      .limit(1);

    if (!user) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    return NextResponse.json({ user });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const body = await req.json();
    const { name, avatarUrl } = body;

    const [updated] = await db
      .update(users)
      .set({ name, avatarUrl, updatedAt: new Date() })
      .where(eq(users.id, auth.sub))
      .returning({ id: users.id, name: users.name, email: users.email, avatarUrl: users.avatarUrl });

    return NextResponse.json({ user: updated });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const now = new Date();

    // Soft-delete the user account.
    await db.update(users).set({ deletedAt: now }).where(eq(users.id, auth.sub));

    // Revoke all active refresh tokens so no session survives deletion.
    await db.update(refreshTokens).set({ revokedAt: now }).where(eq(refreshTokens.userId, auth.sub));

    // Clear auth cookies so the current session ends immediately.
    const cookieDomain = process.env.COOKIE_DOMAIN;
    const expireOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 0,
      path: "/",
      ...(cookieDomain && { domain: cookieDomain }),
    };

    const response = NextResponse.json({ success: true });
    response.cookies.set("access_token", "", expireOptions);
    response.cookies.set("refresh_token", "", expireOptions);
    return response;
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
