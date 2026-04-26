import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authErrorResponse, AuthError } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { transactions, paymentMethods, categories } from "@/lib/db/schema";
import { transactionSchema } from "@/lib/validations/transaction";
import { generateInstallments } from "@/lib/utils/installments";
import { computeEffectiveDate } from "@/lib/utils/invoice";
import { and, eq, gte, lte, isNull, desc, or, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const { searchParams } = new URL(req.url);

    const groupId = searchParams.get("groupId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    // effectiveStartDate / effectiveEndDate filter by COALESCE(effectiveDate, date)
    // so drill-downs in Reports match the same bucketing used by the report APIs.
    const effectiveStartDate = searchParams.get("effectiveStartDate");
    const effectiveEndDate = searchParams.get("effectiveEndDate");
    const type = searchParams.get("type");
    const categoryId = searchParams.get("categoryId");       // "__none__" → NULL
    const bankId = searchParams.get("bankId");               // "__none__" → NULL
    const paymentMethodId = searchParams.get("paymentMethodId"); // "__none__" → NULL
    const isPaid = searchParams.get("isPaid");
    const hideFuture = searchParams.get("hideFuture") === "true";
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "50");
    const offset = (page - 1) * limit;

    const effDate = sql<string>`COALESCE(${transactions.effectiveDate}, ${transactions.date})`;

    const conditions = [isNull(transactions.deletedAt)];

    if (groupId) {
      conditions.push(eq(transactions.groupId, groupId));
    } else {
      conditions.push(eq(transactions.userId, auth.sub));
    }

    if (startDate) conditions.push(gte(transactions.date, startDate));
    if (endDate) conditions.push(lte(transactions.date, endDate));
    if (effectiveStartDate) conditions.push(gte(effDate, effectiveStartDate));
    if (effectiveEndDate) conditions.push(lte(effDate, effectiveEndDate));
    if (type) conditions.push(eq(transactions.type, type));
    if (categoryId === "__none__") conditions.push(isNull(transactions.categoryId));
    else if (categoryId) conditions.push(eq(transactions.categoryId, categoryId));
    if (bankId === "__none__") conditions.push(isNull(transactions.bankId));
    else if (bankId) conditions.push(eq(transactions.bankId, bankId));
    if (paymentMethodId === "__none__") conditions.push(isNull(transactions.paymentMethodId));
    else if (paymentMethodId) conditions.push(eq(transactions.paymentMethodId, paymentMethodId));
    if (isPaid !== null && isPaid !== undefined) {
      conditions.push(eq(transactions.isPaid, isPaid === "true"));
    }
    if (hideFuture) {
      const todayStr = new Date().toISOString().slice(0, 10);
      conditions.push(lte(transactions.date, todayStr));
    }

    const rows = await db
      .select({
        id: transactions.id,
        date: transactions.date,
        effectiveDate: transactions.effectiveDate,
        type: transactions.type,
        description: transactions.description,
        value: transactions.value,
        isPaid: transactions.isPaid,
        categoryId: transactions.categoryId,
        bankId: transactions.bankId,
        installmentCurrent: transactions.installmentCurrent,
        installmentTotal: transactions.installmentTotal,
        installmentGroupId: transactions.installmentGroupId,
        userId: transactions.userId,
        groupId: transactions.groupId,
        notes: transactions.notes,
        categoryName: categories.name,
        categoryColor: categories.color,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
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

    // Resolve payment method for credit-card invoice date calculation.
    let pm: { type: string; closingDay: number | null; dueDay: number | null } | null = null;
    if (input.paymentMethodId) {
      const [row] = await db
        .select({ type: paymentMethods.type, closingDay: paymentMethods.closingDay, dueDay: paymentMethods.dueDay })
        .from(paymentMethods)
        .where(eq(paymentMethods.id, input.paymentMethodId))
        .limit(1);
      if (row) pm = row;
    }

    if (isInstallment) {
      const installments = generateInstallments(
        input.date,
        input.value,
        input.installmentTotal!,
      );

      // For installment purchases the date of each installment already encodes
      // which month the payment falls in (March → April → May, etc.).  Applying
      // computeEffectiveDate to each installment separately would add an extra
      // billing-cycle shift on top of that, pushing installment 2 (already in
      // April) into May, installment 3 into June, and so on.  effectiveDate is
      // therefore left null for all installments — the installment date itself
      // is the effective date for cash-flow purposes.
      const rows = await db
        .insert(transactions)
        .values(
          installments.map((inst) => ({
            userId: auth.sub,
            groupId: input.groupId ?? null,
            date: inst.date,
            effectiveDate: null,
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
          effectiveDate: computeEffectiveDate(input.date, pm),
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
