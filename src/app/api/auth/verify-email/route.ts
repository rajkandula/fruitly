import { handler, parseBody, json, fail, clientIp } from "@/lib/api";
import { verifyEmailSchema } from "@/lib/validation";
import { findUserByEmail, markEmailVerified } from "@/lib/repo/users";
import { verifyOtp, otpErrorMessage } from "@/lib/auth/otp";
import { createSession } from "@/lib/auth/session";
import { sendMail } from "@/lib/mail";
import { welcomeTemplate } from "@/lib/mail/templates";
import { rateLimit } from "@/lib/auth/ratelimit";

export const POST = handler(async (req) => {
  const body = await parseBody(req, verifyEmailSchema);
  const rl = rateLimit(`verify:${clientIp(req)}:${body.email}`, 15, 15 * 60_000);
  if (!rl.ok) return fail(429, `Too many attempts. Try again in ${rl.retryAfterSec}s.`);
  const user = await findUserByEmail(body.email);
  if (!user) return fail(400, "Incorrect code. Please try again.");
  if (!user.email_verified) {
    const check = await verifyOtp(body.email, "verify_email", body.code);
    if (!check.ok) return fail(400, otpErrorMessage(check));
    await markEmailVerified(user.id);
    void sendMail({ to: user.email, ...welcomeTemplate(user.name) });
  }
  await createSession(user.id, { userAgent: req.headers.get("user-agent"), ip: clientIp(req) });
  return json({ ok: true });
});
