import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authErrorResponse, AuthError } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { and, isNotNull, isNull, gt, eq } from "drizzle-orm";

/**
 * POST /api/admin/fix-installment-dates
 *
 * One-off migration: clears effectiveDate for all of the caller's installment
 * transactions (installmentTotal > 1) that have a non-null effectiveDate.
 *
 * Background: prior to the fix, each installment's effectiveDate was computed
 * independently via computeEffectiveDate(), causing installment 2 (already one
 * month ahead of the purchase) to be pushed an extra billing cycle forward —
 * making a March purchase appear in May instead of April on the dashboard.
 *
 * After this migration effectiveDate = null for all installments so the
 * dashboard buckets each installment by its own date (installment 1 → March,
 * installment 2 → April, etc.). Safe to call multiple times (idempotent).
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);

    const result = await db
      .update(transactions)
      .set({ effectiveDate: null })
      .where(
        and(
          eq(transactions.userId, auth.sub),
          isNull(transactions.deletedAt),
          isNotNull(transactions.effectiveDate),
          gt(transactions.installmentTotal, 1),
        ),
      )
      .returning({ id: transactions.id });

    return NextResponse.json({ fixed: result.length });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
