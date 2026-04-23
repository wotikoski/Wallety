import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authErrorResponse, AuthError } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { recurringTransactions, paymentMethods } from "@/lib/db/schema";
import { and, eq, isNull, inArray } from "drizzle-orm";
import { computeOccurrences } from "@/lib/utils/recurrence";
import { computeEffectiveDate } from "@/lib/utils/invoice";
import { parseISO, format, endOfMonth } from "date-fns";

/**
 * GET /api/recurring/projected?from=YYYY-MM-DD&to=YYYY-MM-DD&groupId=
 *
 * Returns on-the-fly projections of every active recurrence template for
 * the caller in the given window. Nothing is persisted — these rows are
 * meant to be rendered as "Previsto" alongside real lançamentos so users
 * get a predictive view of the month without polluting the transactions
 * table or conflating "pending" with "not yet due".
 *
 * Only projects dates strictly after today, since up-to-today occurrences
 * are handled by /api/recurring/materialize and live in /api/transactions.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const groupId = searchParams.get("groupId");

    if (!from || !to) {
      return NextResponse.json({ error: "from e to são obrigatórios" }, { status: 400 });
    }

    const ownerFilter = groupId
      ? eq(recurringTransactions.groupId, groupId)
      : eq(recurringTransactions.userId, auth.sub);

    const rules = await db
      .select()
      .from(recurringTransactions)
      .where(
        and(
          ownerFilter,
          eq(recurringTransactions.isActive, true),
          isNull(recurringTransactions.deletedAt),
        ),
      );

    // Batch fetch credit-card payment methods so projections honor the
    // invoice effective-date rules (same as materialized rows).
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

    const now = new Date();
    // materialize() now covers through end-of-current-month, so projected
    // only needs to show dates strictly after that horizon to avoid duplicates.
    const materializeHorizon = format(endOfMonth(now), "yyyy-MM-dd");
    const toDate = parseISO(to);

    const projected: Array<{
      ruleId: string;
      date: string;
      effectiveDate: string | null;
      type: string;
      description: string;
      value: string;
      categoryId: string | null;
      bankId: string | null;
      paymentMethodId: string | null;
    }> = [];

    for (const rule of rules) {
      const dates = computeOccurrences(
        {
          frequency: rule.frequency,
          dayOfMonth: rule.dayOfMonth,
          startDate: rule.startDate,
          endDate: rule.endDate,
          lastGeneratedDate: rule.lastGeneratedDate,
        },
        toDate,
      );
      const pm = rule.paymentMethodId ? pmMap.get(rule.paymentMethodId) ?? null : null;

      for (const d of dates) {
        // Skip anything within the current month — materialize() covers
        // through end-of-month, so those rows exist (or will exist) as real
        // transactions and should not appear again as projections.
        if (d <= materializeHorizon) continue;
        // Skip anything before the requested window.
        if (d < from) continue;
        projected.push({
          ruleId: rule.id,
          date: d,
          effectiveDate: computeEffectiveDate(d, pm),
          type: rule.type,
          description: rule.description,
          value: rule.value,
          categoryId: rule.categoryId,
          bankId: rule.bankId,
          paymentMethodId: rule.paymentMethodId,
        });
      }
    }

    projected.sort((a, b) => a.date.localeCompare(b.date));
    return NextResponse.json({ projected });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    console.error("[GET /api/recurring/projected]", e);
    const msg = e instanceof Error ? e.message : "Erro ao projetar recorrências";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
