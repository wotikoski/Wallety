import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authErrorResponse, AuthError } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { groups, groupMembers } from "@/lib/db/schema";
import { groupSchema } from "@/lib/validations/group";
import { eq, isNull } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);

    const myGroups = await db
      .select({ group: groups, member: groupMembers })
      .from(groupMembers)
      .innerJoin(groups, eq(groupMembers.groupId, groups.id))
      .where(eq(groupMembers.userId, auth.sub));

    return NextResponse.json({ groups: myGroups.map((r) => ({ ...r.group, role: r.member.role })) });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const body = await req.json();
    const input = groupSchema.parse(body);

    const [group] = await db
      .insert(groups)
      .values({ ...input, ownerId: auth.sub })
      .returning();

    await db.insert(groupMembers).values({
      groupId: group.id,
      userId: auth.sub,
      role: "owner",
    });

    return NextResponse.json({ group }, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
