import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authErrorResponse, AuthError } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { groups, groupMembers, users } from "@/lib/db/schema";
import { groupSchema } from "@/lib/validations/group";
import { and, eq } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(req);

    const membership = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, params.id), eq(groupMembers.userId, auth.sub)))
      .limit(1);

    if (!membership.length) return NextResponse.json({ error: "Sem acesso" }, { status: 403 });

    const [group] = await db.select().from(groups).where(eq(groups.id, params.id)).limit(1);
    if (!group) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    const members = await db
      .select({ user: { id: users.id, name: users.name, email: users.email, avatarUrl: users.avatarUrl }, role: groupMembers.role, joinedAt: groupMembers.joinedAt })
      .from(groupMembers)
      .innerJoin(users, eq(groupMembers.userId, users.id))
      .where(eq(groupMembers.groupId, params.id));

    return NextResponse.json({ group, members });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(req);
    const body = await req.json();
    const input = groupSchema.parse(body);

    const [group] = await db.select().from(groups).where(eq(groups.id, params.id)).limit(1);
    if (!group || group.ownerId !== auth.sub) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const [updated] = await db
      .update(groups)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(groups.id, params.id))
      .returning();

    return NextResponse.json({ group: updated });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(req);
    const [group] = await db.select().from(groups).where(eq(groups.id, params.id)).limit(1);

    if (!group || group.ownerId !== auth.sub) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    await db.update(groups).set({ deletedAt: new Date() }).where(eq(groups.id, params.id));
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
