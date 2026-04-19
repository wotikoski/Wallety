import { SignJWT, jwtVerify } from "jose";

export interface JWTPayload {
  sub: string; // user ID
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

const ACCESS_SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret-change-me");
const REFRESH_SECRET = new TextEncoder().encode(process.env.REFRESH_TOKEN_SECRET ?? "dev-refresh-secret-change-me");

export async function signAccessToken(payload: Omit<JWTPayload, "iat" | "exp">): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN ?? "7d")
    .sign(ACCESS_SECRET);
}

export async function signRefreshToken(userId: string, email: string, name: string): Promise<string> {
  return new SignJWT({ sub: userId, email, name })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.REFRESH_TOKEN_EXPIRES_IN ?? "90d")
    .sign(REFRESH_SECRET);
}

export async function verifyAccessToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, ACCESS_SECRET);
  return payload as unknown as JWTPayload;
}

export async function verifyRefreshToken(token: string): Promise<{ sub: string; email?: string; name?: string }> {
  const { payload } = await jwtVerify(token, REFRESH_SECRET);
  return payload as { sub: string; email?: string; name?: string };
}
