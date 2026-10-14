import { handler, json, fail, parseBody } from "@/lib/api";
import { couponCheckSchema } from "@/lib/validation";
import { applyCoupon } from "@/lib/checkout";

export const POST = handler(async (req) => {
  const body = await parseBody(req, couponCheckSchema);
  const r = await applyCoupon(body.code, body.subtotalCents);
  if (r.error) return fail(400, r.error);
  return json({ ok: true, code: r.code, discountCents: r.discount });
});
