import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authErrorResponse, AuthError } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { banks } from "@/lib/db/schema";
import { bankSchema } from "@/lib/validations/bank";
import { and, eq } from "drizzle-orm";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req);
    const body = await req.json();
    const input = bankSchema.parse(body);

    const [row] = await db
      .update(banks)
      .set(input)
      .where(and(eq(banks.id, id), eq(banks.userId, auth.sub)))
      .returning();

    if (!row) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    return NextResponse.json({ bank: row });
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
      .update(banks)
      .set({ deletedAt: new Date() })
      .where(and(eq(banks.id, id), eq(banks.userId, auth.sub)));

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
