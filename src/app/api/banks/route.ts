import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authErrorResponse, AuthError } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { banks } from "@/lib/db/schema";
import { bankSchema } from "@/lib/validations/bank";
import { and, eq, isNull, or } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");

    const conditions = [isNull(banks.deletedAt)];

    if (groupId) {
      conditions.push(
        or(
          eq(banks.groupId, groupId),
          and(eq(banks.userId, auth.sub), isNull(banks.groupId)),
        )!,
      );
    } else {
      conditions.push(eq(banks.userId, auth.sub));
    }

    const rows = await db.select().from(banks).where(and(...conditions)).orderBy(banks.name);
    return NextResponse.json({ banks: rows });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const body = await req.json();
    const input = bankSchema.parse(body);

    const [row] = await db.insert(banks).values({ ...input, userId: auth.sub }).returning();
    return NextResponse.json({ bank: row }, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
