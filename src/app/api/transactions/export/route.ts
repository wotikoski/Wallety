import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authErrorResponse, AuthError } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { transactions, categories, banks } from "@/lib/db/schema";
import { and, eq, gte, lte, isNull, desc, inArray } from "drizzle-orm";
import { toCSV } from "@/lib/utils/csv";
import { format } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const { searchParams } = new URL(req.url);

    const groupId = searchParams.get("groupId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type");

    const conditions = [isNull(transactions.deletedAt)];
    if (groupId) conditions.push(eq(transactions.groupId, groupId));
    else conditions.push(eq(transactions.userId, auth.sub));
    if (startDate) conditions.push(gte(transactions.date, startDate));
    if (endDate) conditions.push(lte(transactions.date, endDate));
    if (type) conditions.push(eq(transactions.type, type));

    const rows = await db
      .select()
      .from(transactions)
      .where(and(...conditions))
      .orderBy(desc(transactions.date), desc(transactions.createdAt));

    // Resolve category + bank names in bulk (avoids N+1).
    const catIds = [...new Set(rows.map((r) => r.categoryId).filter(Boolean))] as string[];
    const bankIds = [...new Set(rows.map((r) => r.bankId).filter(Boolean))] as string[];

    const catMap = new Map<string, string>();
    if (catIds.length) {
      const cats = await db.select().from(categories).where(inArray(categories.id, catIds));
      cats.forEach((c) => catMap.set(c.id, c.name));
    }
    const bankMap = new Map<string, string>();
    if (bankIds.length) {
      const bks = await db.select().from(banks).where(inArray(banks.id, bankIds));
      bks.forEach((b) => bankMap.set(b.id, b.name));
    }

    const csv = toCSV(rows, [
      { key: "date", label: "Data", format: (v) => String(v ?? "") },
      { key: "type", label: "Tipo", format: (v) => (v === "income" ? "Receita" : "Despesa") },
      { key: "description", label: "Descrição" },
      { key: "value", label: "Valor", format: (v) => String(v ?? "").replace(".", ",") },
      { key: "categoryId", label: "Categoria", format: (v) => (v ? catMap.get(v as string) ?? "" : "") },
      { key: "bankId", label: "Banco", format: (v) => (v ? bankMap.get(v as string) ?? "" : "") },
      { key: "isPaid", label: "Pago", format: (v) => (v ? "Sim" : "Não") },
      {
        key: "installmentCurrent",
        label: "Parcela",
        format: (_v, row) =>
          row.installmentTotal && row.installmentTotal > 1
            ? `${row.installmentCurrent}/${row.installmentTotal}`
            : "",
      },
      { key: "notes", label: "Observações", format: (v) => (v as string) ?? "" },
    ]);

    const filename = `wallety-lancamentos-${format(new Date(), "yyyy-MM-dd")}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
