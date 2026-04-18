import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authErrorResponse, AuthError } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { transactionSchema } from "@/lib/validations/transaction";
import { generateInstallments } from "@/lib/utils/installments";
import { and, eq, gte, lte, isNull, desc, or } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const { searchParams } = new URL(req.url);

    const groupId = searchParams.get("groupId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type");
    const categoryId = searchParams.get("categoryId");
    const isPaid = searchParams.get("isPaid");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "50");
    const offset = (page - 1) * limit;

    const conditions = [isNull(transactions.deletedAt)];

    if (groupId) {
      conditions.push(eq(transactions.groupId, groupId));
    } else {
      conditions.push(eq(transactions.userId, auth.sub));
    }

    if (startDate) conditions.push(gte(transactions.date, startDate));
    if (endDate) conditions.push(lte(transactions.date, endDate));
    if (type) conditions.push(eq(transactions.type, type));
    if (categoryId) conditions.push(eq(transactions.categoryId, categoryId));
    if (isPaid !== null && isPaid !== undefined) {
      conditions.push(eq(transactions.isPaid, isPaid === "true"));
    }

    const rows = await db
      .select()
      .from(transactions)
      .where(and(...conditions))
      .orderBy(desc(transactions.date), desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ transactions: rows, page, limit });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const body = await req.json();
    const input = transactionSchema.parse(body);

    const isInstallment = (input.installmentTotal ?? 1) > 1;

    if (isInstallment) {
      const installments = generateInstallments(
        input.date,
        input.value,
        input.installmentTotal!,
      );

      const rows = await db
        .insert(transactions)
        .values(
          installments.map((inst) => ({
            userId: auth.sub,
            groupId: input.groupId ?? null,
            date: inst.date,
            type: input.type,
            categoryId: input.categoryId ?? null,
            description: input.description,
            value: inst.value,
            paymentMethodId: input.paymentMethodId ?? null,
            bankId: input.bankId ?? null,
            installmentGroupId: inst.installmentGroupId,
            installmentCurrent: inst.installmentCurrent,
            installmentTotal: inst.installmentTotal,
            installmentValue: inst.installmentValue,
            isPaid: input.isPaid,
            isFixed: input.isFixed,
            notes: input.notes ?? null,
          })),
        )
        .returning();

      return NextResponse.json({ transactions: rows }, { status: 201 });
    } else {
      const [row] = await db
        .insert(transactions)
        .values({
          userId: auth.sub,
          groupId: input.groupId ?? null,
          date: input.date,
          type: input.type,
          categoryId: input.categoryId ?? null,
          description: input.description,
          value: input.value.toFixed(2),
          paymentMethodId: input.paymentMethodId ?? null,
          bankId: input.bankId ?? null,
          isPaid: input.isPaid,
          isFixed: input.isFixed,
          notes: input.notes ?? null,
        })
        .returning();

      return NextResponse.json({ transaction: row }, { status: 201 });
    }
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
