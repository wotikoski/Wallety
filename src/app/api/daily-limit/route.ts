import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authErrorResponse, AuthError } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { monthlyBudgets, transactions } from "@/lib/db/schema";
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

    const budgetConditions = [
      eq(monthlyBudgets.year, year),
      eq(monthlyBudgets.month, month),
      eq(monthlyBudgets.userId, auth.sub),
    ];
    if (groupId) budgetConditions.push(eq(monthlyBudgets.groupId, groupId));

    const [budget] = await db
      .select()
      .from(monthlyBudgets)
      .where(and(...budgetConditions))
      .limit(1);

    const plannedIncome = parseFloat(budget?.plannedIncome ?? "0");
    const plannedFixedExpenses = parseFloat(budget?.plannedFixedExpenses ?? "0");

    const scopeCondition = groupId
      ? eq(transactions.groupId, groupId)
      : eq(transactions.userId, auth.sub);

    const variableTxns = await db
      .select()
      .from(transactions)
      .where(
        and(
          scopeCondition,
          isNull(transactions.deletedAt),
          eq(transactions.type, "expense"),
          eq(transactions.isFixed, false),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate),
        ),
      );

    const spentVariable = variableTxns.reduce((acc, t) => acc + parseFloat(t.value), 0);
    const result = calculateDailyLimit(plannedIncome, plannedFixedExpenses, spentVariable, refDate);

    return NextResponse.json({ ...result, budget });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const body = await req.json();
    const { groupId, year, month, plannedIncome, plannedFixedExpenses, notes } = body;

    const existing = await db
      .select()
      .from(monthlyBudgets)
      .where(
        and(
          eq(monthlyBudgets.userId, auth.sub),
          eq(monthlyBudgets.year, year),
          eq(monthlyBudgets.month, month),
          groupId ? eq(monthlyBudgets.groupId, groupId) : isNull(monthlyBudgets.groupId),
        ),
      )
      .limit(1);

    const data = {
      userId: auth.sub,
      groupId: groupId ?? null,
      year,
      month,
      plannedIncome: plannedIncome.toFixed(2),
      plannedFixedExpenses: plannedFixedExpenses.toFixed(2),
      notes: notes ?? null,
      updatedAt: new Date(),
    };

    if (existing.length > 0) {
      const [updated] = await db
        .update(monthlyBudgets)
        .set(data)
        .where(eq(monthlyBudgets.id, existing[0].id))
        .returning();
      return NextResponse.json({ budget: updated });
    } else {
      const [created] = await db.insert(monthlyBudgets).values(data).returning();
      return NextResponse.json({ budget: created }, { status: 201 });
    }
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
