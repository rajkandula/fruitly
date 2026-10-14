import { z } from "zod";
import { handler, json, fail, parseBody, requireAdmin } from "@/lib/api";
import { findUserById, setUserRole } from "@/lib/repo/users";
export const PATCH = handler<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const admin = await requireAdmin();
  const id = Number((await params).id);
  const { role } = await parseBody(req, z.object({ role: z.enum(["admin", "customer"]) }));
  if (id === admin.id && role !== "admin") return fail(400, "You can't remove your own admin role.");
  if (!(await findUserById(id))) return fail(404, "User not found");
  await setUserRole(id, role);
  return json({ ok: true, user: await findUserById(id) });
});
