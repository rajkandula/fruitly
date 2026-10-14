import { handler, parseBody, json, fail, clientIp } from "@/lib/api";
import { resetPasswordSchema } from "@/lib/validation";
import { findUserByEmail, updatePassword, markEmailVerified } from "@/lib/repo/users";
import { verifyOtp, otpErrorMessage } from "@/lib/auth/otp";
import { hashPassword, passwordPolicyError } from "@/lib/auth/password";
import { destroyAllSessions, createSession } from "@/lib/auth/session";
import { rateLimit } from "@/lib/auth/ratelimit";

export const POST = handler(async (req) => {
  const body = await parseBody(req, resetPasswordSchema);
  const rl = rateLimit(`reset:${clientIp(req)}:${body.email}`, 15, 15 * 60_000);
  if (!rl.ok) return fail(429, `Too many attempts. Try again in ${rl.retryAfterSec}s.`);
  const policy = passwordPolicyError(body.password);
  if (policy) return fail(422, policy);
  const user = await findUserByEmail(body.email);
  if (!user) return fail(400, "Incorrect code. Please try again.");
  const check = await verifyOtp(body.email, "reset_password", body.code);
  if (!check.ok) return fail(400, otpErrorMessage(check));
  await updatePassword(user.id, await hashPassword(body.password));
  if (!user.email_verified) await markEmailVerified(user.id);
  await destroyAllSessions(user.id); // sign out everywhere
  await createSession(user.id, { userAgent: req.headers.get("user-agent"), ip: clientIp(req) });
  return json({ ok: true });
});
