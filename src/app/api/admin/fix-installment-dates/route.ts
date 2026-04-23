import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { and, isNotNull, isNull, gt } from "drizzle-orm";

/**
 * POST /api/admin/fix-installment-dates?secret=<ADMIN_SECRET>
 *
 * One-off migration: clears effectiveDate for ALL users' installment
 * transactions (installmentTotal > 1) that have a non-null effectiveDate.
 *
 * Requires the ADMIN_SECRET env variable to match the ?secret= query param.
 * Safe to call multiple times (idempotent).
 */
export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret || secret !== adminSecret) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const result = await db
      .update(transactions)
      .set({ effectiveDate: null })
      .where(
        and(
          isNull(transactions.deletedAt),
          isNotNull(transactions.effectiveDate),
          gt(transactions.installmentTotal, 1),
        ),
      )
      .returning({ id: transactions.id, userId: transactions.userId });

    // Count per user for transparency
    const byUser: Record<string, number> = {};
    for (const row of result) {
      byUser[row.userId] = (byUser[row.userId] ?? 0) + 1;
    }

    return NextResponse.json({ totalFixed: result.length, byUser });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
