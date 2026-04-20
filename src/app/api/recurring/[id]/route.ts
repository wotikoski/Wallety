import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authErrorResponse, AuthError } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { recurringTransactions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req);
    const body = await req.json();

    const [existing] = await db.select().from(recurringTransactions).where(eq(recurringTransactions.id, id)).limit(1);
    if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    if (existing.userId !== auth.sub) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

    const patch: Record<string, unknown> = { ...body, updatedAt: new Date() };
    if (typeof patch.value === "number") patch.value = (patch.value as number).toFixed(2);

    const [updated] = await db
      .update(recurringTransactions)
      .set(patch)
      .where(eq(recurringTransactions.id, id))
      .returning();
    return NextResponse.json({ recurring: updated });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req);
    const [existing] = await db.select().from(recurringTransactions).where(eq(recurringTransactions.id, id)).limit(1);
    if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    if (existing.userId !== auth.sub) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

    await db.update(recurringTransactions).set({ deletedAt: new Date() }).where(eq(recurringTransactions.id, id));
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
