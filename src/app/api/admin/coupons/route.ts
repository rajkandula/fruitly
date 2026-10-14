import { z } from "zod";
import { handler, json, parseBody, requireAdmin } from "@/lib/api";
import { db } from "@/lib/db";
import { upsertCoupon, type Coupon } from "@/lib/repo/coupons";
export const GET = handler(async () => { await requireAdmin(); const database = await db(); return json({ coupons: await database.query<Coupon>("SELECT * FROM coupons ORDER BY id DESC") }); });
const schema = z.object({ code: z.string().trim().min(2).max(40).toUpperCase(), type: z.enum(["percent", "fixed"]), value: z.number().int().positive(), min_subtotal_cents: z.number().int().nonnegative().optional().default(0), max_uses: z.number().int().positive().nullable().optional(), expires_at: z.string().datetime().nullable().optional(), is_active: z.boolean().optional().default(true) });
export const POST = handler(async (req) => {
  await requireAdmin();
  const b = await parseBody(req, schema);
  if (b.type === "percent" && b.value > 100) return json({ error: "Percent must be ≤ 100" }, { status: 422 });
  await upsertCoupon({ code: b.code, type: b.type, value: b.value, min_subtotal_cents: b.min_subtotal_cents, max_uses: b.max_uses ?? null, expires_at: b.expires_at ?? null, is_active: b.is_active ? 1 : 0 });
  return json({ ok: true }, { status: 201 });
});
