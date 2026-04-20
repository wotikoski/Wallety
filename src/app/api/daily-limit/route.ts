import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authErrorResponse, AuthError } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { and, eq, gte, lte, isNull } from "drizzle-orm";
import { calculateDailyLimit } from "@/lib/utils/daily-limit";
import { format, startOfMonth, endOfMonth } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");
    const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));

    const refDate = new Date(year, month - 1, 1);
    const startDate = format(startOfMonth(refDate), "yyyy-MM-dd");
    const endDate = format(endOfMonth(refDate), "yyyy-MM-dd");

    const scopeCondition = groupId
      ? eq(transactions.groupId, groupId)
      : eq(transactions.userId, auth.sub);

    const baseCondition = and(
      scopeCondition,
      isNull(transactions.deletedAt),
      gte(transactions.date, startDate),
      lte(transactions.date, endDate),
    );

    // Query all transactions for the month in one shot
    const allTxns = await db
      .select({ type: transactions.type, value: transactions.value, isFixed: transactions.isFixed })
      .from(transactions)
      .where(baseCondition);

    const actualIncome = allTxns
      .filter((t) => t.type === "income")
      .reduce((acc, t) => acc + parseFloat(t.value), 0);

    const actualFixedExpenses = allTxns
      .filter((t) => t.type === "expense" && t.isFixed)
      .reduce((acc, t) => acc + parseFloat(t.value), 0);

    const spentVariable = allTxns
      .filter((t) => t.type === "expense" && !t.isFixed)
      .reduce((acc, t) => acc + parseFloat(t.value), 0);

    const result = calculateDailyLimit(actualIncome, actualFixedExpenses, spentVariable, refDate);

    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
