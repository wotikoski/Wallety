import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authErrorResponse, AuthError } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { and, eq, gte, lte, isNull } from "drizzle-orm";
import { calculateDailyLimit } from "@/lib/utils/daily-limit";
import { format, startOfMonth, endOfMonth, addMonths } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");
    const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));

    const refDate = new Date(year, month - 1, 1);
    const nextMonthDate = addMonths(refDate, 1);

    const scopeCondition = groupId
      ? eq(transactions.groupId, groupId)
      : eq(transactions.userId, auth.sub);

    // Query current month transactions
    const currentTxns = await db
      .select({ type: transactions.type, value: transactions.value, isFixed: transactions.isFixed })
      .from(transactions)
      .where(and(
        scopeCondition,
        isNull(transactions.deletedAt),
        gte(transactions.date, format(startOfMonth(refDate), "yyyy-MM-dd")),
        lte(transactions.date, format(endOfMonth(refDate), "yyyy-MM-dd")),
      ));

    // Query next month transactions (already scheduled installments, recurring, etc.)
    const nextMonthTxns = await db
      .select({ type: transactions.type, value: transactions.value })
      .from(transactions)
      .where(and(
        scopeCondition,
        isNull(transactions.deletedAt),
        gte(transactions.date, format(startOfMonth(nextMonthDate), "yyyy-MM-dd")),
        lte(transactions.date, format(endOfMonth(nextMonthDate), "yyyy-MM-dd")),
      ));

    const actualIncome = currentTxns
      .filter((t) => t.type === "income")
      .reduce((acc, t) => acc + parseFloat(t.value), 0);

    const actualFixedExpenses = currentTxns
      .filter((t) => t.type === "expense" && t.isFixed)
      .reduce((acc, t) => acc + parseFloat(t.value), 0);

    const spentVariable = currentTxns
      .filter((t) => t.type === "expense" && !t.isFixed)
      .reduce((acc, t) => acc + parseFloat(t.value), 0);

    const nextMonthIncome = nextMonthTxns
      .filter((t) => t.type === "income")
      .reduce((acc, t) => acc + parseFloat(t.value), 0);

    const nextMonthExpenses = nextMonthTxns
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => acc + parseFloat(t.value), 0);

    const result = calculateDailyLimit(
      actualIncome,
      actualFixedExpenses,
      spentVariable,
      nextMonthIncome,
      nextMonthExpenses,
      refDate,
    );

    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
