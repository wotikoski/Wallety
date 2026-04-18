import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authErrorResponse, AuthError } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { groups, groupMembers, groupInvites, users } from "@/lib/db/schema";
import { inviteSchema } from "@/lib/validations/group";
import { and, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { addDays } from "date-fns";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("userId");

    const [group] = await db.select().from(groups).where(eq(groups.id, params.id)).limit(1);
    if (!group) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    if (group.ownerId !== auth.sub && memberId !== auth.sub) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    await db
      .delete(groupMembers)
      .where(and(eq(groupMembers.groupId, params.id), eq(groupMembers.userId, memberId ?? auth.sub)));

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(req);
    const body = await req.json();
    const input = inviteSchema.parse(body);

    const [group] = await db.select().from(groups).where(eq(groups.id, params.id)).limit(1);
    if (!group) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    const token = uuidv4();
    await db.insert(groupInvites).values({
      groupId: params.id,
      email: input.email,
      token,
      invitedBy: auth.sub,
      expiresAt: addDays(new Date(), 7),
    });

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/grupos/entrar?token=${token}`;

    return NextResponse.json({ success: true, inviteUrl, token });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
