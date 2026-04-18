import { NextRequest } from "next/server";
import { verifyAccessToken, JWTPayload } from "./jwt";

export async function getAuthUser(req: NextRequest): Promise<JWTPayload | null> {
  const token = req.cookies.get("access_token")?.value;
  if (!token) return null;

  try {
    return await verifyAccessToken(token);
  } catch {
    return null;
  }
}

export async function requireAuth(req: NextRequest): Promise<JWTPayload> {
  const user = await getAuthUser(req);
  if (!user) {
    throw new AuthError("Não autenticado");
  }
  return user;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export function authErrorResponse() {
  return new Response(JSON.stringify({ error: "Não autenticado" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
