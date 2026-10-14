import { handler, json, fail, parseBody, requireUser } from "@/lib/api";
import { changePasswordSchema } from "@/lib/validation";
import { findUserByEmail, updatePassword } from "@/lib/repo/users";
import { hashPassword, passwordPolicyError, verifyPassword } from "@/lib/auth/password";
import { destroyAllSessions, getCurrentAuth } from "@/lib/auth/session";

export const POST = handler(async (req) => {
  const auth = await getCurrentAuth();
  const user = await requireUser();
  const body = await parseBody(req, changePasswordSchema);
  const policy = passwordPolicyError(body.newPassword);
  if (policy) return fail(422, policy);
  const full = await findUserByEmail(user.email);
  if (!full || !(await verifyPassword(body.currentPassword, full.password_hash))) return fail(400, "Your current password is incorrect.");
  await updatePassword(user.id, await hashPassword(body.newPassword));
  await destroyAllSessions(user.id, auth?.sid); // keep this session, sign out all others
  return json({ ok: true });
});
