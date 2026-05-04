import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authErrorResponse, AuthError } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { goals } from "@/lib/db/schema";
import { goalSchema } from "@/lib/validations/goal";
import { and, eq, isNull, asc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");

    const conditions = [isNull(goals.deletedAt)];

    if (groupId) {
      conditions.push(eq(goals.groupId, groupId));
    } else {
      conditions.push(eq(goals.userId, auth.sub));
    }

    const rows = await db
      .select()
      .from(goals)
      .where(and(...conditions))
      .orderBy(asc(goals.targetDate));

    return NextResponse.json({ goals: rows });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const body = await req.json();
    const input = goalSchema.parse(body);

    const [row] = await db
      .insert(goals)
      .values({
        userId: auth.sub,
        groupId: input.groupId ?? null,
        name: input.name,
        targetAmount: String(input.targetAmount),
        targetDate: input.targetDate,
        savedAmount: String(input.savedAmount ?? 0),
        color: input.color ?? "#6366f1",
        emoji: input.emoji ?? "🎯",
        notes: input.notes ?? null,
      })
      .returning();

    return NextResponse.json({ goal: row }, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
