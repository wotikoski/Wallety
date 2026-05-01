import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authErrorResponse, AuthError } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { transactions, paymentMethods } from "@/lib/db/schema";
import { computeEffectiveDate } from "@/lib/utils/invoice";
import { updateTransactionSchema } from "@/lib/validations/transaction";
import { eq, and, isNull, gte } from "drizzle-orm";

// Normalize optional UUID fields: HTML <select> with an empty first option
// gives "" when unselected, but the DB column wants NULL. Without this, we'd
// either store "" (invalid UUID → pg error) or worse, silently drop the
// update. Empty strings become null; real values pass through unchanged.
function normalizeOptionalId(v: unknown): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null || v === "") return null;
  return v as string;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req);
    const [row] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), isNull(transactions.deletedAt)))
      .limit(1);

    if (!row) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    if (row.userId !== auth.sub) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

    return NextResponse.json({ transaction: row });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req);
    const rawBody = await req.json();

    // Pre-normalize "" → null for optional ID fields before zod (which would
    // otherwise reject "" as an invalid UUID and 400 the request).
    if ("categoryId" in rawBody) rawBody.categoryId = normalizeOptionalId(rawBody.categoryId);
    if ("paymentMethodId" in rawBody) rawBody.paymentMethodId = normalizeOptionalId(rawBody.paymentMethodId);
    if ("bankId" in rawBody) rawBody.bankId = normalizeOptionalId(rawBody.bankId);
    if ("groupId" in rawBody) rawBody.groupId = normalizeOptionalId(rawBody.groupId);

    const parsed = updateTransactionSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
    }
    const { scope = "single", ...data } = parsed.data;

    const [existing] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), isNull(transactions.deletedAt)))
      .limit(1);

    if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    if (existing.userId !== auth.sub) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

    // Build updateData only from fields the client actually sent. Spreading
    // a partial zod result would include `undefined` for untouched fields,
    // which Drizzle then writes as NULL — wiping unrelated columns.
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    const allow = [
      "date", "type", "categoryId", "description", "paymentMethodId",
      "bankId", "installmentTotal", "isPaid", "isFixed", "groupId", "notes",
    ] as const;
    for (const k of allow) {
      if (k in data && (data as Record<string, unknown>)[k] !== undefined) {
        updateData[k] = (data as Record<string, unknown>)[k];
      }
    }
    // pg numeric columns want strings; the form submits numbers.
    if (data.value !== undefined) updateData.value = data.value.toFixed(2);
    if (data.installmentValue !== undefined) {
      updateData.installmentValue = data.installmentValue === null ? null : data.installmentValue.toFixed(2);
    }

    // Recompute effectiveDate if date or paymentMethod changed.
    // Installment transactions always keep effectiveDate = null — the installment
    // date itself is the effective date for cash-flow bucketing (see POST route).
    // Recomputing here would shift each installment into the wrong billing month.
    if (existing.installmentGroupId) {
      updateData.effectiveDate = null;
    } else {
      const newDate = (data.date as string | undefined) ?? existing.date;
      const newPmId = data.paymentMethodId !== undefined ? data.paymentMethodId : existing.paymentMethodId;
      if (newPmId) {
        const [pm] = await db
          .select({ type: paymentMethods.type, closingDay: paymentMethods.closingDay, dueDay: paymentMethods.dueDay })
          .from(paymentMethods)
          .where(eq(paymentMethods.id, newPmId))
          .limit(1);
        updateData.effectiveDate = computeEffectiveDate(newDate, pm ?? null);
      } else {
        updateData.effectiveDate = null;
      }
    }

    if (scope === "single" || !existing.installmentGroupId) {
      const [updated] = await db
        .update(transactions)
        .set(updateData)
        .where(eq(transactions.id, id))
        .returning();
      return NextResponse.json({ transaction: updated });
    }

    if (scope === "all") {
      await db
        .update(transactions)
        .set(updateData)
        .where(eq(transactions.installmentGroupId, existing.installmentGroupId!));
    } else if (scope === "this_and_future") {
      await db
        .update(transactions)
        .set(updateData)
        .where(
          and(
            eq(transactions.installmentGroupId, existing.installmentGroupId!),
            gte(transactions.installmentCurrent, existing.installmentCurrent!),
          ),
        );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req);
    const body = await req.json();

    const [existing] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), isNull(transactions.deletedAt)))
      .limit(1);

    if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    if (existing.userId !== auth.sub) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

    // Coerce timestamp fields: the DB column expects Date, but JSON only carries strings.
    const patch: Record<string, unknown> = { ...body, updatedAt: new Date() };
    if (typeof patch.paidAt === "string") patch.paidAt = new Date(patch.paidAt);

    const [updated] = await db
      .update(transactions)
      .set(patch)
      .where(eq(transactions.id, id))
      .returning();

    return NextResponse.json({ transaction: updated });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    console.error("PATCH /api/transactions/[id] error:", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope") ?? "single";

    const [existing] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), isNull(transactions.deletedAt)))
      .limit(1);

    if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    if (existing.userId !== auth.sub) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

    const now = new Date();

    if (scope === "single" || !existing.installmentGroupId) {
      await db.update(transactions).set({ deletedAt: now }).where(eq(transactions.id, id));
    } else if (scope === "all") {
      await db
        .update(transactions)
        .set({ deletedAt: now })
        .where(eq(transactions.installmentGroupId, existing.installmentGroupId!));
    } else if (scope === "this_and_future") {
      await db
        .update(transactions)
        .set({ deletedAt: now })
        .where(
          and(
            eq(transactions.installmentGroupId, existing.installmentGroupId!),
            gte(transactions.installmentCurrent, existing.installmentCurrent!),
          ),
        );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
