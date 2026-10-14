import { db } from "../db";
import { env } from "../env";
import { harakumo } from "../harakumo";
import type { User } from "../types";

export interface UserWithHash extends User { password_hash: string }

const USER_COLS = "id, email, name, role, email_verified, phone, created_at, last_login_at";

export async function findUserByEmail(email: string): Promise<UserWithHash | null> {
  const database = await db();
  return database.get<UserWithHash>(`SELECT ${USER_COLS}, password_hash FROM users WHERE email = ?`, [email]);
}
export async function findUserById(id: number): Promise<User | null> {
  const database = await db();
  return database.get<User>(`SELECT ${USER_COLS} FROM users WHERE id = ?`, [id]);
}

export function roleForEmail(email: string): "admin" | "customer" {
  return env.adminEmails.includes(email.toLowerCase()) ? "admin" : "customer";
}

export async function createUser(input: { email: string; name: string; passwordHash: string }): Promise<User> {
  const database = await db();
  const role = roleForEmail(input.email);
  const res = await database.run(
    "INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, ?)",
    [input.email, input.name, input.passwordHash, role],
  );
  const user = await findUserById(res.lastRowId);
  if (!user) throw new Error("Failed to create user");
  // Best-effort mirror into the Harakumo auth pool (user directory). Never blocks signup.
  void mirrorToAuthPool(user);
  return user;
}

async function mirrorToAuthPool(user: User) {
  const hk = harakumo();
  if (!hk || !env.harakumoAuthPoolId) return;
  try {
    const { user: hkUser } = await hk.auth.signup(env.harakumoAuthPoolId, { email: user.email, name: user.name });
    const database = await db();
    await database.run("UPDATE users SET hk_auth_user_id = ? WHERE id = ?", [hkUser.id, user.id]);
  } catch (err) {
    console.warn("[auth-pool] mirror failed:", err instanceof Error ? err.message : err);
  }
}

export async function markEmailVerified(userId: number) {
  const database = await db();
  await database.run("UPDATE users SET email_verified = 1, updated_at = datetime('now') WHERE id = ?", [userId]);
}
export async function updatePassword(userId: number, passwordHash: string) {
  const database = await db();
  await database.run("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?", [passwordHash, userId]);
}
export async function updateProfile(userId: number, input: { name?: string; phone?: string | null }) {
  const database = await db();
  await database.run("UPDATE users SET name = COALESCE(?, name), phone = ?, updated_at = datetime('now') WHERE id = ?", [input.name ?? null, input.phone ?? null, userId]);
}
export async function listUsers(limit = 100, offset = 0) {
  const database = await db();
  return database.query<User & { order_count: number; total_spent_cents: number }>(
    `SELECT u.id, u.email, u.name, u.role, u.email_verified, u.phone, u.created_at, u.last_login_at,
            (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS order_count,
            (SELECT COALESCE(SUM(total_cents),0) FROM orders o WHERE o.user_id = u.id AND o.status <> 'cancelled') AS total_spent_cents
       FROM users u ORDER BY u.id DESC LIMIT ? OFFSET ?`, [limit, offset]);
}
export async function setUserRole(userId: number, role: "admin" | "customer") {
  const database = await db();
  await database.run("UPDATE users SET role = ?, updated_at = datetime('now') WHERE id = ?", [role, userId]);
}
export async function listSessions(userId: number) {
  const database = await db();
  return database.query<{ id: string; user_agent: string; ip: string; created_at: string; last_seen_at: string; expires_at: string }>(
    "SELECT id, user_agent, ip, created_at, last_seen_at, expires_at FROM sessions WHERE user_id = ? ORDER BY created_at DESC", [userId]);
}
export async function deleteSession(userId: number, sid: string) {
  const database = await db();
  await database.run("DELETE FROM sessions WHERE user_id = ? AND id = ?", [userId, sid]);
}
