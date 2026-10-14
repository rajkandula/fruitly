import { handler, parseBody, json, fail, clientIp } from "@/lib/api";
import { otpRequestSchema } from "@/lib/validation";
import { findUserByEmail } from "@/lib/repo/users";
import { issueOtp, OtpCooldownError } from "@/lib/auth/otp";
import { sendMail } from "@/lib/mail";
import { loginOtpTemplate, resetPasswordTemplate, verifyEmailTemplate } from "@/lib/mail/templates";
import { rateLimit } from "@/lib/auth/ratelimit";
import { maskEmail } from "@/lib/utils";

/** Issues a one-time code by email for: email verification, passwordless sign-in, or password reset. */
export const POST = handler(async (req) => {
  const body = await parseBody(req, otpRequestSchema);
  const rl = rateLimit(`otp:${clientIp(req)}`, 10, 10 * 60_000);
  if (!rl.ok) return fail(429, `Too many requests. Try again in ${rl.retryAfterSec}s.`);

  const generic = { ok: true, message: `If an account exists for ${maskEmail(body.email)}, a code is on its way.` };
  const user = await findUserByEmail(body.email);
  if (!user) return json(generic); // don't reveal account existence
  if (body.purpose === "verify_email" && user.email_verified) return json({ ok: true, alreadyVerified: true, message: "This email is already verified. Please sign in." });

  try {
    const code = await issueOtp(user.email, body.purpose);
    const t = body.purpose === "login" ? loginOtpTemplate(user.name, code)
      : body.purpose === "reset_password" ? resetPasswordTemplate(user.name, code)
      : verifyEmailTemplate(user.name, code);
    await sendMail({ to: user.email, ...t });
  } catch (err) {
    if (err instanceof OtpCooldownError) return fail(429, err.message);
    throw err;
  }
  return json(generic);
});
