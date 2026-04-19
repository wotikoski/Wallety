import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { registerSchema } from "@/lib/validations/auth";
import { eq } from "drizzle-orm";
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from "@/lib/constants/default-categories";
import { DEFAULT_BANKS } from "@/lib/constants/default-banks";
import { categories, banks, paymentMethods } from "@/lib/db/schema";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = registerSchema.parse(body);

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "E-mail já cadastrado" },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(input.password);

    const [user] = await db
      .insert(users)
      .values({ name: input.name, email: input.email, passwordHash })
      .returning({ id: users.id, name: users.name, email: users.email });

    // Seed default categories
    const expenseCats = DEFAULT_EXPENSE_CATEGORIES.map((c) => ({
      ...c,
      userId: user.id,
      type: "expense" as const,
      isDefault: true,
    }));
    const incomeCats = DEFAULT_INCOME_CATEGORIES.map((c) => ({
      ...c,
      userId: user.id,
      type: "income" as const,
      isDefault: true,
    }));
    await db.insert(categories).values([...expenseCats, ...incomeCats]);

    // Seed default banks
    await db.insert(banks).values(
      DEFAULT_BANKS.map((b) => ({ ...b, userId: user.id, isDefault: true })),
    );

    // Seed default payment methods
    await db.insert(paymentMethods).values([
      { userId: user.id, name: "Conta Corrente", type: "bank_account", isDefault: true },
      { userId: user.id, name: "Dinheiro", type: "cash", isDefault: true },
      { userId: user.id, name: "Pix", type: "pix", isDefault: true },
      { userId: user.id, name: "Cartão de Crédito", type: "credit_card", isDefault: true },
      { userId: user.id, name: "Cartão de Débito", type: "debit_card", isDefault: true },
    ]);

    const accessToken = await signAccessToken({
      sub: user.id,
      email: user.email,
      name: user.name,
    });
    const refreshToken = await signRefreshToken(user.id, user.email, user.name);

    const response = NextResponse.json({ user }, { status: 201 });
    const cookieDomain = process.env.COOKIE_DOMAIN;
    response.cookies.set("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
      ...(cookieDomain && { domain: cookieDomain }),
    });
    response.cookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 90 * 24 * 60 * 60,
      path: "/",
      ...(cookieDomain && { domain: cookieDomain }),
    });

    return response;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Dados inválidos", details: error }, { status: 400 });
    }
    console.error("Register error:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
