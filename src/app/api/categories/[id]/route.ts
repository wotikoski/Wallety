import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authErrorResponse, AuthError } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { categorySchema } from "@/lib/validations/category";
import { and, eq, isNull } from "drizzle-orm";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req);
    const body = await req.json();
    const input = categorySchema.parse(body);

    const [row] = await db
      .update(categories)
      .set(input)
      .where(and(eq(categories.id, id), eq(categories.userId, auth.sub)))
      .returning();

    if (!row) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    return NextResponse.json({ category: row });
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
      .update(categories)
      .set({ deletedAt: new Date() })
      .where(and(eq(categories.id, id), eq(categories.userId, auth.sub)));

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
