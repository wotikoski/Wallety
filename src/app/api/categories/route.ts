import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authErrorResponse, AuthError } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { categorySchema } from "@/lib/validations/category";
import { and, eq, isNull, or } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");
    const type = searchParams.get("type");

    const conditions = [isNull(categories.deletedAt)];

    if (groupId) {
      conditions.push(or(eq(categories.groupId, groupId), isNull(categories.groupId))!);
    } else {
      conditions.push(
        or(
          eq(categories.userId, auth.sub),
          eq(categories.isDefault, true),
        )!,
      );
    }

    if (type && type !== "both") {
      conditions.push(or(eq(categories.type, type), eq(categories.type, "both"))!);
    }

    const rows = await db
      .select()
      .from(categories)
      .where(and(...conditions))
      .orderBy(categories.name);

    return NextResponse.json({ categories: rows });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const body = await req.json();
    const input = categorySchema.parse(body);

    const [row] = await db
      .insert(categories)
      .values({ ...input, userId: auth.sub })
      .returning();

    return NextResponse.json({ category: row }, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
