import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authErrorResponse, AuthError } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { transactions, categories, banks, users, paymentMethods } from "@/lib/db/schema";
import { and, eq, gte, lte, isNull, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const groupId  = searchParams.get("groupId");
    const startDate = searchParams.get("startDate") ?? "";
    const endDate   = searchParams.get("endDate")   ?? "";
    const groupBy   = searchParams.get("groupBy")   ?? "category";
    // "fixed" | "variable" | null → filters the breakdown (not the totals)
    const costType  = searchParams.get("costType");

    const scopeCondition = groupId
      ? eq(transactions.groupId, groupId)
      : eq(transactions.userId, auth.sub);

    // Use effectiveDate when set (credit-card billing month), else purchase date.
    // Mirrors the dashboard logic so report totals match dashboard totals.
    const effDate = sql<string>`COALESCE(${transactions.effectiveDate}, ${transactions.date})`;

    const txns = await db
      .select()
      .from(transactions)
      .where(
        and(
          scopeCondition,
          isNull(transactions.deletedAt),
          eq(transactions.type, "expense"),
          startDate ? gte(effDate, startDate) : undefined,
          endDate ? lte(effDate, endDate) : undefined,
        ),
      );

    // Helper: is a transaction "fixed" (recurring or manually marked)?
    const isFixed = (t: { recurrenceGroupId: string | null; isFixed: boolean }) =>
      t.recurrenceGroupId !== null || t.isFixed;

    // Fixed/variable totals are always computed from the full set — they power
    // the stats header regardless of which cost-type filter is active.
    const allFixedTotal    = txns.filter(isFixed).reduce((acc, t) => acc + parseFloat(t.value), 0);
    const allVariableTotal = txns.reduce((acc, t) => acc + parseFloat(t.value), 0) - allFixedTotal;

    // Apply cost-type filter for the breakdown grouping.
    // Percentages become relative to the filtered subset
    // (e.g. "what % of my fixed expenses goes to Housing?").
    const filteredTxns =
      costType === "fixed"    ? txns.filter(isFixed) :
      costType === "variable" ? txns.filter((t) => !isFixed(t)) :
      txns;

    const grandTotal = filteredTxns.reduce((acc, t) => acc + parseFloat(t.value), 0);
    let groups: Record<string, { label: string; total: number; count: number; groupKey: string }> = {};

    if (groupBy === "category") {
      const cats = await db.select().from(categories).where(isNull(categories.deletedAt));
      const catMap = Object.fromEntries(cats.map((c) => [c.id, c.name]));
      for (const t of filteredTxns) {
        const key = t.categoryId ?? "__none__";
        const label = t.categoryId ? (catMap[t.categoryId] ?? "Outros") : "Sem Categoria";
        if (!groups[key]) groups[key] = { label, total: 0, count: 0, groupKey: key };
        groups[key].total += parseFloat(t.value);
        groups[key].count++;
      }
    } else if (groupBy === "bank") {
      const bks = await db.select().from(banks).where(isNull(banks.deletedAt));
      const bankMap = Object.fromEntries(bks.map((b) => [b.id, b.name]));
      for (const t of filteredTxns) {
        const key = t.bankId ?? "__none__";
        const label = t.bankId ? (bankMap[t.bankId] ?? "Outro Banco") : "Sem Banco";
        if (!groups[key]) groups[key] = { label, total: 0, count: 0, groupKey: key };
        groups[key].total += parseFloat(t.value);
        groups[key].count++;
      }
    } else if (groupBy === "user") {
      const usrs = await db.select({ id: users.id, name: users.name }).from(users);
      const userMap = Object.fromEntries(usrs.map((u) => [u.id, u.name]));
      for (const t of filteredTxns) {
        const key = t.userId;
        const label = userMap[t.userId] ?? "Usuário";
        if (!groups[key]) groups[key] = { label, total: 0, count: 0, groupKey: key };
        groups[key].total += parseFloat(t.value);
        groups[key].count++;
      }
    } else if (groupBy === "paymentMethod") {
      const pms = await db.select({ id: paymentMethods.id, name: paymentMethods.name }).from(paymentMethods).where(isNull(paymentMethods.deletedAt));
      const pmMap = Object.fromEntries(pms.map((p) => [p.id, p.name]));
      for (const t of filteredTxns) {
        const key = t.paymentMethodId ?? "__none__";
        const label = t.paymentMethodId ? (pmMap[t.paymentMethodId] ?? "Outra Forma") : "Sem Forma de Pagamento";
        if (!groups[key]) groups[key] = { label, total: 0, count: 0, groupKey: key };
        groups[key].total += parseFloat(t.value);
        groups[key].count++;
      }
    }

    const items = Object.values(groups)
      .map((g) => ({ ...g, percentage: grandTotal > 0 ? (g.total / grandTotal) * 100 : 0 }))
      .sort((a, b) => b.total - a.total);

    return NextResponse.json({
      items,
      grandTotal,
      groupBy,
      fixedTotal: allFixedTotal,
      variableTotal: allVariableTotal,
    });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
