import { handler, json, parseBody, requireUser } from "@/lib/api";
import { profileSchema } from "@/lib/validation";
import { findUserById, updateProfile } from "@/lib/repo/users";

export const GET = handler(async () => json({ user: await requireUser() }));

export const PUT = handler(async (req) => {
  const user = await requireUser();
  const body = await parseBody(req, profileSchema);
  await updateProfile(user.id, { name: body.name, phone: body.phone ?? null });
  return json({ ok: true, user: await findUserById(user.id) });
});
