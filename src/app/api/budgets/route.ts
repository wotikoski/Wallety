import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authErrorResponse, AuthError } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { categoryBudgets, transactions, categories } from "@/lib/db/schema";
import { categoryBudgetSchema } from "@/lib/validations/budget";
import { and, eq, gte, lte, isNull, inArray, sql } from "drizzle-orm";
import { format, startOfMonth, endOfMonth } from "date-fns";

/**
 * GET /api/budgets?year=2026&month=4&groupId=...
 * Returns budgets for the period joined with actual spending per category.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const { searchParams } = new URL(req.url);

    const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));
    const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));
    const groupId = searchParams.get("groupId");

    const ownerFilter = groupId
      ? eq(categoryBudgets.groupId, groupId)
      : eq(categoryBudgets.userId, auth.sub);

    const budgets = await db
      .select()
      .from(categoryBudgets)
      .where(and(ownerFilter, eq(categoryBudgets.year, year), eq(categoryBudgets.month, month)));

    // Compute actual spent per category for the period.
    const refDate = new Date(year, month - 1, 1);
    const start = format(startOfMonth(refDate), "yyyy-MM-dd");
    const end = format(endOfMonth(refDate), "yyyy-MM-dd");

    const txnOwner = groupId
      ? eq(transactions.groupId, groupId)
      : eq(transactions.userId, auth.sub);

    const effDate = sql<string>`COALESCE(${transactions.effectiveDate}, ${transactions.date})`;
    const spentRows = await db
      .select({
        categoryId: transactions.categoryId,
        total: sql<string>`SUM(${transactions.value})`,
      })
      .from(transactions)
      .where(
        and(
          txnOwner,
          isNull(transactions.deletedAt),
          eq(transactions.type, "expense"),
          gte(effDate, start),
          lte(effDate, end),
        ),
      )
      .groupBy(transactions.categoryId);

    const spentMap = new Map<string, number>();
    spentRows.forEach((r) => {
      if (r.categoryId) spentMap.set(r.categoryId, parseFloat(r.total ?? "0"));
    });

    // Enrich with category name/color.
    const catIds = budgets.map((b) => b.categoryId);
    const catMap = new Map<string, { name: string; color: string | null; icon: string | null }>();
    if (catIds.length) {
      const cats = await db.select().from(categories).where(inArray(categories.id, catIds));
      cats.forEach((c) => catMap.set(c.id, { name: c.name, color: c.color, icon: c.icon }));
    }

    const result = budgets.map((b) => ({
      ...b,
      spent: spentMap.get(b.categoryId) ?? 0,
      category: catMap.get(b.categoryId) ?? null,
    }));

    return NextResponse.json({ budgets: result });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    console.error("[GET /api/budgets]", e);
    const msg = e instanceof Error ? e.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** POST /api/budgets — upsert. Body validated by categoryBudgetSchema. */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const body = await req.json();
    const input = categoryBudgetSchema.parse(body);

    // Upsert: if a budget for (user, category, year, month) exists, update amount.
    const [existing] = await db
      .select()
      .from(categoryBudgets)
      .where(
        and(
          eq(categoryBudgets.userId, auth.sub),
          eq(categoryBudgets.categoryId, input.categoryId),
          eq(categoryBudgets.year, input.year),
          eq(categoryBudgets.month, input.month),
        ),
      )
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(categoryBudgets)
        .set({ amount: input.amount.toFixed(2), updatedAt: new Date() })
        .where(eq(categoryBudgets.id, existing.id))
        .returning();
      return NextResponse.json({ budget: updated });
    }

    const [row] = await db
      .insert(categoryBudgets)
      .values({
        userId: auth.sub,
        groupId: input.groupId ?? null,
        categoryId: input.categoryId,
        year: input.year,
        month: input.month,
        amount: input.amount.toFixed(2),
      })
      .returning();

    return NextResponse.json({ budget: row }, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    console.error("[POST /api/budgets]", e);
    const msg = e instanceof Error ? e.message : "Erro ao salvar orçamento";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
