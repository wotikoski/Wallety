import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authErrorResponse, AuthError } from "@/lib/auth/middleware";
import { neon } from "@neondatabase/serverless";

// One-time migration endpoint: adds supports_installments column to payment_methods.
// Requires a valid session. Safe to call multiple times (IF NOT EXISTS).
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);

    const sql = neon(process.env.DATABASE_URL!);

    await sql`
      ALTER TABLE payment_methods
        ADD COLUMN IF NOT EXISTS supports_installments boolean NOT NULL DEFAULT false
    `;

    return NextResponse.json({ ok: true, message: "Migration applied (or already up to date)." });
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse();
    console.error("Migration error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
