import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { ENV } from "./env";

const ALG = "HS256";

function getSecret() {
  return new TextEncoder().encode(ENV.cookieSecret);
}

export interface JwtPayload {
  sub: string; // userId as string
  email: string;
  role: string;
  name: string | null;
}

export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export const COOKIE_NAME = "wa_auth_token";

export function setCookie(res: { cookie: Function }, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: ENV.isProduction,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: "/",
  });
}

export function clearCookie(res: { clearCookie: Function }) {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}
