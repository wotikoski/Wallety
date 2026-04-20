import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authErrorResponse, AuthError } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { recurringTransactions } from "@/lib/db/schema";
import { recurringTransactionSchema } from "@/lib/validations/recurring";
import { and, eq, isNull, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");

    const owner = groupId
      ? eq(recurringTransactions.groupId, groupId)
      : eq(recurringTransactions.userId, auth.sub);

    const rows = await db
      .select()
      .from(recurringTransactions)
      .where(and(owner, isNull(recurringTransactions.deletedAt)))
      .orderBy(desc(recurringTransactions.createdAt));

    return NextResponse.json({ recurring: rows });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const body = await req.json();
    const input = recurringTransactionSchema.parse(body);

    const [row] = await db
      .insert(recurringTransactions)
      .values({
        userId: auth.sub,
        groupId: input.groupId ?? null,
        type: input.type,
        categoryId: input.categoryId ?? null,
        description: input.description,
        value: input.value.toFixed(2),
        paymentMethodId: input.paymentMethodId ?? null,
        bankId: input.bankId ?? null,
        notes: input.notes ?? null,
        frequency: input.frequency,
        dayOfMonth: input.dayOfMonth ?? null,
        startDate: input.startDate,
        endDate: input.endDate ?? null,
      })
      .returning();

    return NextResponse.json({ recurring: row }, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    console.error("[POST /api/recurring]", e);
    const msg = e instanceof Error ? e.message : "Erro ao salvar recorrência";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
