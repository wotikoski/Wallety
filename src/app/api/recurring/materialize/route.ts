import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authErrorResponse, AuthError } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { recurringTransactions, transactions, paymentMethods } from "@/lib/db/schema";
import { and, eq, isNull, inArray } from "drizzle-orm";
import { computeOccurrences } from "@/lib/utils/recurrence";
import { computeEffectiveDate } from "@/lib/utils/invoice";
import { format } from "date-fns";

/**
 * POST /api/recurring/materialize
 * Walks every active recurring template for the caller and inserts concrete
 * transaction rows for any occurrences due up to today that haven't been
 * generated yet. Intended to be called lazily (e.g. on dashboard load) or
 * by a cron.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");

    const rules = await db
      .select()
      .from(recurringTransactions)
      .where(
        and(
          eq(recurringTransactions.userId, auth.sub),
          eq(recurringTransactions.isActive, true),
          isNull(recurringTransactions.deletedAt),
        ),
      );

    // Batch-fetch payment methods referenced by these rules so we can compute
    // credit-card effective dates without an extra query per occurrence.
    const pmIds = Array.from(
      new Set(rules.map((r) => r.paymentMethodId).filter((v): v is string => !!v)),
    );
    const pmMap = new Map<string, { type: string; closingDay: number | null; dueDay: number | null }>();
    if (pmIds.length > 0) {
      const pms = await db
        .select({
          id: paymentMethods.id,
          type: paymentMethods.type,
          closingDay: paymentMethods.closingDay,
          dueDay: paymentMethods.dueDay,
        })
        .from(paymentMethods)
        .where(inArray(paymentMethods.id, pmIds));
      pms.forEach((p) => pmMap.set(p.id, { type: p.type, closingDay: p.closingDay, dueDay: p.dueDay }));
    }

    let created = 0;
    for (const rule of rules) {
      const pm = rule.paymentMethodId ? pmMap.get(rule.paymentMethodId) ?? null : null;
      const dates = computeOccurrences(
        {
          frequency: rule.frequency,
          dayOfMonth: rule.dayOfMonth,
          startDate: rule.startDate,
          endDate: rule.endDate,
          lastGeneratedDate: rule.lastGeneratedDate,
        },
        today,
      );
      if (dates.length === 0) continue;

      await db.insert(transactions).values(
        dates.map((d) => ({
          userId: rule.userId,
          groupId: rule.groupId,
          date: d,
          effectiveDate: computeEffectiveDate(d, pm),
          type: rule.type,
          categoryId: rule.categoryId,
          description: rule.description,
          value: rule.value,
          paymentMethodId: rule.paymentMethodId,
          bankId: rule.bankId,
          notes: rule.notes,
          isFixed: true,
          recurrenceGroupId: rule.id,
          isPaid: false,
        })),
      );

      await db
        .update(recurringTransactions)
        .set({ lastGeneratedDate: dates[dates.length - 1], updatedAt: new Date() })
        .where(eq(recurringTransactions.id, rule.id));

      created += dates.length;
    }

    return NextResponse.json({ created, asOf: todayStr });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
