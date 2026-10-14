import { handler, parseBody, json, fail, clientIp } from "@/lib/api";
import { loginSchema } from "@/lib/validation";
import { findUserByEmail } from "@/lib/repo/users";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { issueOtp, OtpCooldownError } from "@/lib/auth/otp";
import { sendMail } from "@/lib/mail";
import { verifyEmailTemplate } from "@/lib/mail/templates";
import { rateLimit } from "@/lib/auth/ratelimit";

export const POST = handler(async (req) => {
  const body = await parseBody(req, loginSchema);
  const rl = rateLimit(`login:${clientIp(req)}:${body.email}`, 8, 15 * 60_000);
  if (!rl.ok) return fail(429, `Too many sign-in attempts. Try again in ${rl.retryAfterSec}s.`);

  const user = await findUserByEmail(body.email);
  const ok = user ? await verifyPassword(body.password, user.password_hash) : false;
  if (!user || !ok) return fail(401, "Incorrect email or password.");

  if (!user.email_verified) {
    try {
      const code = await issueOtp(user.email, "verify_email");
      await sendMail({ to: user.email, ...verifyEmailTemplate(user.name, code) });
    } catch (err) { if (!(err instanceof OtpCooldownError)) throw err; }
    return json({ ok: true, requiresVerification: true, email: user.email });
  }

  await createSession(user.id, { userAgent: req.headers.get("user-agent"), ip: clientIp(req) });
  const { password_hash: _h, ...safe } = user; void _h;
  return json({ ok: true, user: safe });
});
