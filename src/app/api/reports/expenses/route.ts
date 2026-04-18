import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authErrorResponse, AuthError } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { transactions, categories, banks, users } from "@/lib/db/schema";
import { and, eq, gte, lte, isNull } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");
    const startDate = searchParams.get("startDate") ?? "";
    const endDate = searchParams.get("endDate") ?? "";
    const groupBy = searchParams.get("groupBy") ?? "category";

    const scopeCondition = groupId
      ? eq(transactions.groupId, groupId)
      : eq(transactions.userId, auth.sub);

    const txns = await db
      .select()
      .from(transactions)
      .where(
        and(
          scopeCondition,
          isNull(transactions.deletedAt),
          eq(transactions.type, "expense"),
          startDate ? gte(transactions.date, startDate) : undefined,
          endDate ? lte(transactions.date, endDate) : undefined,
        ),
      );

    const grandTotal = txns.reduce((acc, t) => acc + parseFloat(t.value), 0);
    let groups: Record<string, { label: string; total: number; count: number }> = {};

    if (groupBy === "category") {
      const cats = await db.select().from(categories).where(isNull(categories.deletedAt));
      const catMap = Object.fromEntries(cats.map((c) => [c.id, c.name]));
      for (const t of txns) {
        const key = t.categoryId ?? "other";
        const label = t.categoryId ? (catMap[t.categoryId] ?? "Outros") : "Sem Categoria";
        if (!groups[key]) groups[key] = { label, total: 0, count: 0 };
        groups[key].total += parseFloat(t.value);
        groups[key].count++;
      }
    } else if (groupBy === "bank") {
      const bks = await db.select().from(banks).where(isNull(banks.deletedAt));
      const bankMap = Object.fromEntries(bks.map((b) => [b.id, b.name]));
      for (const t of txns) {
        const key = t.bankId ?? "none";
        const label = t.bankId ? (bankMap[t.bankId] ?? "Outro Banco") : "Sem Banco";
        if (!groups[key]) groups[key] = { label, total: 0, count: 0 };
        groups[key].total += parseFloat(t.value);
        groups[key].count++;
      }
    } else if (groupBy === "user") {
      const usrs = await db.select({ id: users.id, name: users.name }).from(users);
      const userMap = Object.fromEntries(usrs.map((u) => [u.id, u.name]));
      for (const t of txns) {
        const key = t.userId;
        const label = userMap[t.userId] ?? "Usuário";
        if (!groups[key]) groups[key] = { label, total: 0, count: 0 };
        groups[key].total += parseFloat(t.value);
        groups[key].count++;
      }
    }

    const items = Object.values(groups)
      .map((g) => ({ ...g, percentage: grandTotal > 0 ? (g.total / grandTotal) * 100 : 0 }))
      .sort((a, b) => b.total - a.total);

    return NextResponse.json({ items, grandTotal, groupBy });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
