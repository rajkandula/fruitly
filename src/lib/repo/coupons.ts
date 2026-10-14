import { db } from "../db";

export interface Coupon { id: number; code: string; type: "percent" | "fixed"; value: number; min_subtotal_cents: number; max_uses: number | null; uses: number; expires_at: string | null; is_active: number }

export async function findCoupon(code: string): Promise<Coupon | null> {
  const database = await db();
  return database.get<Coupon>("SELECT * FROM coupons WHERE code = ? COLLATE NOCASE", [code.trim()]);
}

export function couponDiscount(c: Coupon, subtotalCents: number): { ok: true; discountCents: number } | { ok: false; reason: string } {
  if (!c.is_active) return { ok: false, reason: "This coupon is no longer active." };
  if (c.expires_at && new Date(c.expires_at).getTime() < Date.now()) return { ok: false, reason: "This coupon has expired." };
  if (c.max_uses !== null && c.uses >= c.max_uses) return { ok: false, reason: "This coupon has reached its usage limit." };
  if (subtotalCents < c.min_subtotal_cents) return { ok: false, reason: `Minimum order of $${(c.min_subtotal_cents / 100).toFixed(2)} required.` };
  const d = c.type === "percent" ? Math.round((subtotalCents * c.value) / 100) : c.value;
  return { ok: true, discountCents: Math.min(d, subtotalCents) };
}

export async function incrementCouponUse(code: string) {
  const database = await db();
  await database.run("UPDATE coupons SET uses = uses + 1 WHERE code = ? COLLATE NOCASE", [code]);
}
export async function upsertCoupon(c: Omit<Coupon, "id" | "uses">) {
  const database = await db();
  await database.run(
    `INSERT INTO coupons (code, type, value, min_subtotal_cents, max_uses, expires_at, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(code) DO UPDATE SET type = excluded.type, value = excluded.value, min_subtotal_cents = excluded.min_subtotal_cents, max_uses = excluded.max_uses, expires_at = excluded.expires_at, is_active = excluded.is_active`,
    [c.code, c.type, c.value, c.min_subtotal_cents, c.max_uses, c.expires_at, c.is_active]);
}
