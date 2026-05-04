import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authErrorResponse, AuthError } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { goals } from "@/lib/db/schema";
import { goalSchema, depositSchema } from "@/lib/validations/goal";
import { and, eq, isNull, sql } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req);
    const body = await req.json();

    // Deposit mode: just add to savedAmount
    if (body.depositAmount !== undefined) {
      const { amount } = depositSchema.parse({ amount: body.depositAmount });

      const [row] = await db
        .update(goals)
        .set({
          savedAmount: sql`${goals.savedAmount} + ${String(amount)}`,
          updatedAt: new Date(),
        })
        .where(and(eq(goals.id, id), eq(goals.userId, auth.sub), isNull(goals.deletedAt)))
        .returning();

      if (!row) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
      return NextResponse.json({ goal: row });
    }

    // Full update
    const input = goalSchema.parse(body);

    const [row] = await db
      .update(goals)
      .set({
        name: input.name,
        targetAmount: String(input.targetAmount),
        targetDate: input.targetDate,
        savedAmount: String(input.savedAmount ?? 0),
        color: input.color ?? "#6366f1",
        emoji: input.emoji ?? "🎯",
        notes: input.notes ?? null,
        updatedAt: new Date(),
      })
      .where(and(eq(goals.id, id), eq(goals.userId, auth.sub), isNull(goals.deletedAt)))
      .returning();

    if (!row) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    return NextResponse.json({ goal: row });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req);

    await db
      .update(goals)
      .set({ deletedAt: new Date() })
      .where(and(eq(goals.id, id), eq(goals.userId, auth.sub)));

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
