import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/auth/middleware";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    return NextResponse.json({ id: user.sub, email: user.email, name: user.name });
  } catch {
    return authErrorResponse();
  }
}
