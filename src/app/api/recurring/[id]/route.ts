import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authErrorResponse, AuthError } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { recurringTransactions, transactions } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";


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

    // If startDate is being moved to an earlier date, reset lastGeneratedDate
    // so the next materialization re-evaluates occurrences from the new start.
    // The materialize endpoint deduplicates by date, so no double-inserts occur.
    if (
      typeof patch.startDate === "string" &&
      patch.startDate < existing.startDate
    ) {
      patch.lastGeneratedDate = null;
    }

    const [updated] = await db
      .update(recurringTransactions)
      .set(patch)
      .where(eq(recurringTransactions.id, id))
      .returning();

    // Propagate template changes to already-materialized transactions so that
    // reports and the transaction list reflect the edit immediately.
    // Use explicit typed fields so Drizzle maps camelCase → snake_case correctly.
    const txPatch: Partial<typeof transactions.$inferInsert> = {};
    if ("type" in body) txPatch.type = body.type;
    if ("categoryId" in body) txPatch.categoryId = body.categoryId ?? null;
    if ("description" in body) txPatch.description = body.description;
    if ("value" in body && typeof body.value === "number") txPatch.value = body.value.toFixed(2);
    if ("paymentMethodId" in body) txPatch.paymentMethodId = body.paymentMethodId ?? null;
    if ("bankId" in body) txPatch.bankId = body.bankId ?? null;
    if ("notes" in body) txPatch.notes = body.notes ?? null;

    if (Object.keys(txPatch).length > 0) {
      await db
        .update(transactions)
        .set(txPatch)
        .where(and(eq(transactions.recurrenceGroupId, id), isNull(transactions.deletedAt)));
    }

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

    const now = new Date();
    // Soft-delete the rule itself.
    await db.update(recurringTransactions).set({ deletedAt: now }).where(eq(recurringTransactions.id, id));
    // Soft-delete every transaction that was materialized from this rule so
    // they disappear from the dashboard, recent list and category charts.
    await db.update(transactions).set({ deletedAt: now }).where(eq(transactions.recurrenceGroupId, id));
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
