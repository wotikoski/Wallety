import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authErrorResponse, AuthError } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { eq, and, isNull, gte } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req);
    const [row] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), isNull(transactions.deletedAt)))
      .limit(1);

    if (!row) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    if (row.userId !== auth.sub) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

    return NextResponse.json({ transaction: row });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req);
    const body = await req.json();
    const { scope = "single", ...data } = body;

    const [existing] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), isNull(transactions.deletedAt)))
      .limit(1);

    if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    if (existing.userId !== auth.sub) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    if (scope === "single" || !existing.installmentGroupId) {
      const [updated] = await db
        .update(transactions)
        .set(updateData)
        .where(eq(transactions.id, id))
        .returning();
      return NextResponse.json({ transaction: updated });
    }

    if (scope === "all") {
      await db
        .update(transactions)
        .set(updateData)
        .where(eq(transactions.installmentGroupId, existing.installmentGroupId!));
    } else if (scope === "this_and_future") {
      await db
        .update(transactions)
        .set(updateData)
        .where(
          and(
            eq(transactions.installmentGroupId, existing.installmentGroupId!),
            gte(transactions.installmentCurrent, existing.installmentCurrent!),
          ),
        );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req);
    const body = await req.json();

    const [existing] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), isNull(transactions.deletedAt)))
      .limit(1);

    if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    if (existing.userId !== auth.sub) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

    // Coerce timestamp fields: the DB column expects Date, but JSON only carries strings.
    const patch: Record<string, unknown> = { ...body, updatedAt: new Date() };
    if (typeof patch.paidAt === "string") patch.paidAt = new Date(patch.paidAt);

    const [updated] = await db
      .update(transactions)
      .set(patch)
      .where(eq(transactions.id, id))
      .returning();

    return NextResponse.json({ transaction: updated });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    console.error("PATCH /api/transactions/[id] error:", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope") ?? "single";

    const [existing] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), isNull(transactions.deletedAt)))
      .limit(1);

    if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    if (existing.userId !== auth.sub) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

    const now = new Date();

    if (scope === "single" || !existing.installmentGroupId) {
      await db.update(transactions).set({ deletedAt: now }).where(eq(transactions.id, id));
    } else if (scope === "all") {
      await db
        .update(transactions)
        .set({ deletedAt: now })
        .where(eq(transactions.installmentGroupId, existing.installmentGroupId!));
    } else if (scope === "this_and_future") {
      await db
        .update(transactions)
        .set({ deletedAt: now })
        .where(
          and(
            eq(transactions.installmentGroupId, existing.installmentGroupId!),
            gte(transactions.installmentCurrent, existing.installmentCurrent!),
          ),
        );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
