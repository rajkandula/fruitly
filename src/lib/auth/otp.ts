import { createHash, timingSafeEqual } from "node:crypto";
import { db } from "../db";
import { env } from "../env";
import { plusMinutes, randomOtp } from "../utils";

export type OtpPurpose = "verify_email" | "login" | "reset_password";

const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SEC = 45;

function hashCode(email: string, purpose: string, code: string): string {
  return createHash("sha256").update(`${email}|${purpose}|${code}|${env.authSecret || "dev"}`).digest("hex");
}

export class OtpCooldownError extends Error {
  constructor(public retryInSec: number) { super(`Please wait ${retryInSec}s before requesting a new code.`); }
}

/** Issues a new OTP for (email, purpose), invalidating older ones. Returns the plaintext code for sending. */
export async function issueOtp(email: string, purpose: OtpPurpose): Promise<string> {
  const database = await db();
  const latest = await database.get<{ created_at: string }>(
    "SELECT created_at FROM otp_codes WHERE email = ? AND purpose = ? AND consumed = 0 ORDER BY id DESC LIMIT 1",
    [email, purpose],
  );
  if (latest) {
    const ageSec = (Date.now() - new Date(latest.created_at.replace(" ", "T") + (latest.created_at.includes("Z") ? "" : "Z")).getTime()) / 1000;
    if (ageSec >= 0 && ageSec < RESEND_COOLDOWN_SEC) throw new OtpCooldownError(Math.ceil(RESEND_COOLDOWN_SEC - ageSec));
  }
  await database.run("UPDATE otp_codes SET consumed = 1 WHERE email = ? AND purpose = ? AND consumed = 0", [email, purpose]);
  const code = randomOtp(6);
  await database.run(
    "INSERT INTO otp_codes (email, purpose, code_hash, expires_at) VALUES (?, ?, ?, ?)",
    [email, purpose, hashCode(email, purpose, code), plusMinutes(env.otpTtlMinutes)],
  );
  return code;
}

export type OtpCheck = { ok: true } | { ok: false; reason: "invalid" | "expired" | "too_many_attempts" | "not_found" };

/** Verifies a code; on success the OTP is consumed. */
export async function verifyOtp(email: string, purpose: OtpPurpose, code: string): Promise<OtpCheck> {
  const database = await db();
  const row = await database.get<{ id: number; code_hash: string; attempts: number; expires_at: string }>(
    "SELECT id, code_hash, attempts, expires_at FROM otp_codes WHERE email = ? AND purpose = ? AND consumed = 0 ORDER BY id DESC LIMIT 1",
    [email, purpose],
  );
  if (!row) return { ok: false, reason: "not_found" };
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await database.run("UPDATE otp_codes SET consumed = 1 WHERE id = ?", [row.id]);
    return { ok: false, reason: "expired" };
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    await database.run("UPDATE otp_codes SET consumed = 1 WHERE id = ?", [row.id]);
    return { ok: false, reason: "too_many_attempts" };
  }
  const expected = Buffer.from(row.code_hash, "hex");
  const actual = Buffer.from(hashCode(email, purpose, code.trim()), "hex");
  const match = expected.length === actual.length && timingSafeEqual(expected, actual);
  if (!match) {
    await database.run("UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?", [row.id]);
    return { ok: false, reason: row.attempts + 1 >= MAX_ATTEMPTS ? "too_many_attempts" : "invalid" };
  }
  await database.run("UPDATE otp_codes SET consumed = 1 WHERE id = ?", [row.id]);
  return { ok: true };
}

export function otpErrorMessage(check: Exclude<OtpCheck, { ok: true }>): string {
  switch (check.reason) {
    case "expired": return "That code has expired. Please request a new one.";
    case "too_many_attempts": return "Too many incorrect attempts. Please request a new code.";
    case "not_found": return "No active code found. Please request a new one.";
    default: return "Incorrect code. Please try again.";
  }
}
