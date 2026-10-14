import { handler, parseBody, json, fail, clientIp } from "@/lib/api";
import { signupSchema } from "@/lib/validation";
import { createUser, findUserByEmail } from "@/lib/repo/users";
import { hashPassword, passwordPolicyError } from "@/lib/auth/password";
import { issueOtp, OtpCooldownError } from "@/lib/auth/otp";
import { sendMail } from "@/lib/mail";
import { verifyEmailTemplate } from "@/lib/mail/templates";
import { rateLimit } from "@/lib/auth/ratelimit";
import { maskEmail } from "@/lib/utils";

export const POST = handler(async (req) => {
  const rl = rateLimit(`signup:${clientIp(req)}`, 10, 10 * 60_000);
  if (!rl.ok) return fail(429, `Too many attempts. Try again in ${rl.retryAfterSec}s.`);
  const body = await parseBody(req, signupSchema);
  const policy = passwordPolicyError(body.password);
  if (policy) return fail(422, policy);

  const existing = await findUserByEmail(body.email);
  if (existing) {
    // Don't leak whether the email exists: behave like success but nudge to sign in.
    if (existing.email_verified) return json({ ok: true, requiresVerification: false, message: "An account with this email already exists. Please sign in." }, { status: 200 });
    try {
      const code = await issueOtp(body.email, "verify_email");
      await sendMail({ to: body.email, ...verifyEmailTemplate(existing.name, code) });
    } catch (err) { if (!(err instanceof OtpCooldownError)) throw err; }
    return json({ ok: true, requiresVerification: true, email: body.email, message: `We sent a new verification code to ${maskEmail(body.email)}.` });
  }

  const user = await createUser({ email: body.email, name: body.name, passwordHash: await hashPassword(body.password) });
  const code = await issueOtp(user.email, "verify_email");
  await sendMail({ to: user.email, ...verifyEmailTemplate(user.name, code) });
  return json({ ok: true, requiresVerification: true, email: user.email, message: `Verification code sent to ${maskEmail(user.email)}.` }, { status: 201 });
});
