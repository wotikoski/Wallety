import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authErrorResponse, AuthError } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { transactions, categories } from "@/lib/db/schema";
import { and, eq, gte, lte, isNull, inArray, desc } from "drizzle-orm";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");
    const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));

    const refDate = new Date(year, month - 1, 1);
    const start = format(startOfMonth(refDate), "yyyy-MM-dd");
    const end = format(endOfMonth(refDate), "yyyy-MM-dd");

    // For monthly trend: range covers the last 6 months up to `end`.
    const trendStart = format(startOfMonth(subMonths(refDate, 5)), "yyyy-MM-dd");

    const scopeCondition = groupId
      ? eq(transactions.groupId, groupId)
      : eq(transactions.userId, auth.sub);

    // Single query pulling the whole window (6 months). We bucket in JS.
    const windowTxns = await db
      .select()
      .from(transactions)
      .where(
        and(
          scopeCondition,
          isNull(transactions.deletedAt),
          gte(transactions.date, trendStart),
          lte(transactions.date, end),
        ),
      )
      .orderBy(desc(transactions.date));

    // Current month subset (drives totals + recent list + category breakdown).
    const currentMonthTxns = windowTxns.filter((t) => t.date >= start && t.date <= end);

    const totalIncome = currentMonthTxns
      .filter((t) => t.type === "income")
      .reduce((acc, t) => acc + parseFloat(t.value), 0);

    const totalExpenses = currentMonthTxns
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => acc + parseFloat(t.value), 0);

    const paidExpenses = currentMonthTxns
      .filter((t) => t.type === "expense" && t.isPaid)
      .reduce((acc, t) => acc + parseFloat(t.value), 0);

    // Group current-month expenses by category.
    const expensesByCategory: Record<
      string,
      { categoryId: string | null; name: string; total: number; color: string }
    > = {};
    for (const t of currentMonthTxns.filter((t) => t.type === "expense")) {
      const key = t.categoryId ?? "other";
      if (!expensesByCategory[key]) {
        expensesByCategory[key] = { categoryId: t.categoryId, name: "Outros", total: 0, color: "#94a3b8" };
      }
      expensesByCategory[key].total += parseFloat(t.value);
    }

    // Only fetch the category rows we actually need.
    const catIds = Object.keys(expensesByCategory).filter((k) => k !== "other");
    if (catIds.length > 0) {
      const cats = await db
        .select()
        .from(categories)
        .where(and(inArray(categories.id, catIds), isNull(categories.deletedAt)));
      for (const cat of cats) {
        if (expensesByCategory[cat.id]) {
          expensesByCategory[cat.id].name = cat.name;
          expensesByCategory[cat.id].color = cat.color ?? "#94a3b8";
        }
      }
    }

    // Build the 6-month trend from the same windowTxns (no extra queries).
    const monthlyTrend: { month: string; income: number; expenses: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(refDate, i);
      const ms = format(startOfMonth(d), "yyyy-MM-dd");
      const me = format(endOfMonth(d), "yyyy-MM-dd");
      const monthTxns = windowTxns.filter((t) => t.date >= ms && t.date <= me);
      monthlyTrend.push({
        month: format(d, "MMM/yy"),
        income: monthTxns.filter((t) => t.type === "income").reduce((acc, t) => acc + parseFloat(t.value), 0),
        expenses: monthTxns.filter((t) => t.type === "expense").reduce((acc, t) => acc + parseFloat(t.value), 0),
      });
    }

    return NextResponse.json({
      totalIncome,
      totalExpenses,
      paidExpenses,
      pendingExpenses: totalExpenses - paidExpenses,
      balance: totalIncome - totalExpenses,
      expensesByCategory: Object.values(expensesByCategory).sort((a, b) => b.total - a.total),
      monthlyTrend,
      recentTransactions: currentMonthTxns.slice(0, 10),
    });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
