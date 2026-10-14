import { z } from "zod";
import { handler, json, parseBody, requireAdmin } from "@/lib/api";
import { db } from "@/lib/db";
type Ctx = { params: Promise<{ id: string }> };
export const PATCH = handler<Ctx>(async (req, { params }) => {
  await requireAdmin();
  const { is_active } = await parseBody(req, z.object({ is_active: z.boolean() }));
  const database = await db();
  await database.run("UPDATE coupons SET is_active = ? WHERE id = ?", [is_active ? 1 : 0, Number((await params).id)]);
  return json({ ok: true });
});
export const DELETE = handler<Ctx>(async (_req, { params }) => {
  await requireAdmin();
  const database = await db();
  await database.run("DELETE FROM coupons WHERE id = ?", [Number((await params).id)]);
  return json({ ok: true });
});
