import { handler, parseBody, json, fail, clientIp } from "@/lib/api";
import { otpLoginSchema } from "@/lib/validation";
import { findUserByEmail, markEmailVerified } from "@/lib/repo/users";
import { verifyOtp, otpErrorMessage } from "@/lib/auth/otp";
import { createSession } from "@/lib/auth/session";
import { rateLimit } from "@/lib/auth/ratelimit";

/** Passwordless sign-in with an emailed one-time code. */
export const POST = handler(async (req) => {
  const body = await parseBody(req, otpLoginSchema);
  const rl = rateLimit(`otplogin:${clientIp(req)}:${body.email}`, 15, 15 * 60_000);
  if (!rl.ok) return fail(429, `Too many attempts. Try again in ${rl.retryAfterSec}s.`);
  const user = await findUserByEmail(body.email);
  if (!user) return fail(400, "Incorrect code. Please try again.");
  const check = await verifyOtp(body.email, "login", body.code);
  if (!check.ok) return fail(400, otpErrorMessage(check));
  if (!user.email_verified) await markEmailVerified(user.id); // proving inbox access verifies the email
  await createSession(user.id, { userAgent: req.headers.get("user-agent"), ip: clientIp(req) });
  return json({ ok: true });
});
