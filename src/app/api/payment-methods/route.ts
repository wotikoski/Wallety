import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authErrorResponse, AuthError } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { paymentMethods } from "@/lib/db/schema";
import { paymentMethodSchema } from "@/lib/validations/payment-method";
import { and, eq, isNull, or } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";

// Ensure the supports_installments column exists and backfill credit cards.
// Safe to run on every cold start (IF NOT EXISTS / WHERE already true).
async function ensureSchema() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    await sql`
      ALTER TABLE payment_methods
        ADD COLUMN IF NOT EXISTS supports_installments boolean NOT NULL DEFAULT false
    `;
    // Backfill: credit cards should default to true for existing rows.
    await sql`
      UPDATE payment_methods
        SET supports_installments = true
        WHERE type = 'credit_card' AND supports_installments = false
    `;
  } catch {
    // Non-critical — ignore.
  }
}

export async function GET(req: NextRequest) {
  await ensureSchema();
  try {
    const auth = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");

    const conditions = [isNull(paymentMethods.deletedAt)];

    if (groupId) {
      conditions.push(
        or(
          eq(paymentMethods.groupId, groupId),
          and(eq(paymentMethods.userId, auth.sub), isNull(paymentMethods.groupId)),
        )!,
      );
    } else {
      conditions.push(eq(paymentMethods.userId, auth.sub));
    }

    const rows = await db.select().from(paymentMethods).where(and(...conditions)).orderBy(paymentMethods.name);
    return NextResponse.json({ paymentMethods: rows });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const body = await req.json();
    const input = paymentMethodSchema.parse(body);

    const [row] = await db.insert(paymentMethods).values({ ...input, userId: auth.sub }).returning();
    return NextResponse.json({ paymentMethod: row }, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
