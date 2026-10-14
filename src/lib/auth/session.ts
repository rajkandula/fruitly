import { cookies, headers } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { cache } from "react";
import { db } from "../db";
import { env } from "../env";
import { plusDays, randomId } from "../utils";
import type { User } from "../types";

export const SESSION_COOKIE = "fruitly_session";

function secretKey(): Uint8Array {
  const s = env.authSecret;
  if (!s) {
    if (env.isProd) throw new Error("AUTH_SECRET must be set in production");
    return new TextEncoder().encode("dev-only-insecure-secret-change-me-please-1234567890");
  }
  return new TextEncoder().encode(s);
}

export interface SessionClaims { sid: string; uid: number }

export async function signSessionToken(claims: SessionClaims, days = env.sessionDays): Promise<string> {
  return new SignJWT({ sid: claims.sid, uid: claims.uid })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(env.appName)
    .setExpirationTime(`${days}d`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { issuer: env.appName });
    if (typeof payload.sid !== "string" || typeof payload.uid !== "number") return null;
    return { sid: payload.sid, uid: payload.uid };
  } catch {
    return null;
  }
}

/** Creates a DB-backed session for a user and sets the cookie. Returns the session id. */
export async function createSession(userId: number, meta: { userAgent?: string | null; ip?: string | null } = {}): Promise<string> {
  const database = await db();
  const sid = randomId(32);
  await database.run(
    "INSERT INTO sessions (id, user_id, user_agent, ip, expires_at) VALUES (?, ?, ?, ?, ?)",
    [sid, userId, (meta.userAgent ?? "").slice(0, 300), (meta.ip ?? "").slice(0, 64), plusDays(env.sessionDays)],
  );
  await database.run("UPDATE users SET last_login_at = datetime('now') WHERE id = ?", [userId]);
  const token = await signSessionToken({ sid, uid: userId });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProd,
    path: "/",
    maxAge: env.sessionDays * 86400,
  });
  return sid;
}

export async function destroyCurrentSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    const claims = await verifySessionToken(token);
    if (claims) {
      const database = await db();
      await database.run("DELETE FROM sessions WHERE id = ?", [claims.sid]);
    }
  }
  jar.delete(SESSION_COOKIE);
}

export async function destroyAllSessions(userId: number, exceptSid?: string): Promise<void> {
  const database = await db();
  if (exceptSid) await database.run("DELETE FROM sessions WHERE user_id = ? AND id <> ?", [userId, exceptSid]);
  else await database.run("DELETE FROM sessions WHERE user_id = ?", [userId]);
}

export interface CurrentAuth { user: User; sid: string }

/** Resolves the current user from the session cookie (memoised per request). */
export const getCurrentAuth = cache(async (): Promise<CurrentAuth | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const claims = await verifySessionToken(token);
  if (!claims) return null;
  const database = await db();
  const row = await database.get<User & { session_expires: string }>(
    `SELECT u.id, u.email, u.name, u.role, u.email_verified, u.phone, u.created_at, u.last_login_at, s.expires_at AS session_expires
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.id = ? AND s.user_id = ?`,
    [claims.sid, claims.uid],
  );
  if (!row) return null;
  if (new Date(row.session_expires).getTime() < Date.now()) {
    await database.run("DELETE FROM sessions WHERE id = ?", [claims.sid]);
    return null;
  }
  const { session_expires: _ignored, ...user } = row;
  void _ignored;
  return { user: { ...user, email_verified: Number(user.email_verified) } as User, sid: claims.sid };
});

export async function getCurrentUser(): Promise<User | null> {
  return (await getCurrentAuth())?.user ?? null;
}

export async function requestMeta(): Promise<{ userAgent: string; ip: string }> {
  const h = await headers();
  return {
    userAgent: h.get("user-agent") ?? "",
    ip: (h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "").split(",")[0].trim(),
  };
}
