import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authErrorResponse, AuthError } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { paymentMethods } from "@/lib/db/schema";
import { paymentMethodSchema } from "@/lib/validations/payment-method";
import { and, eq } from "drizzle-orm";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req);
    const body = await req.json();
    const input = paymentMethodSchema.parse(body);

    const [row] = await db
      .update(paymentMethods)
      .set(input)
      .where(and(eq(paymentMethods.id, id), eq(paymentMethods.userId, auth.sub)))
      .returning();

    if (!row) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    return NextResponse.json({ paymentMethod: row });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req);
    await db
      .update(paymentMethods)
      .set({ deletedAt: new Date() })
      .where(and(eq(paymentMethods.id, id), eq(paymentMethods.userId, auth.sub)));

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
