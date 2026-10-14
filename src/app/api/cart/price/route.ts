import { z } from "zod";
import { handler, json, parseBody } from "@/lib/api";
import { cartItemSchema } from "@/lib/validation";
import { applyCoupon, computeTotals } from "@/lib/checkout";
import { getProductsByIds } from "@/lib/repo/products";

/** Re-prices a cart from the database: returns live prices, stock, and totals (tolerant of unavailable items). */
export const POST = handler(async (req) => {
  const body = await parseBody(req, z.object({ items: z.array(cartItemSchema).max(100), couponCode: z.string().trim().max(40).optional().nullable(), fulfillment: z.enum(["delivery", "pickup"]).optional() }));
  const products = await getProductsByIds(body.items.map((i) => i.productId));
  const byId = new Map(products.map((p) => [p.id, p]));
  const lines = body.items.map((i) => {
    const p = byId.get(i.productId);
    if (!p || !p.is_active) return { productId: i.productId, available: false, stock: 0, quantity: i.quantity, priceCents: 0, lineTotal: 0 };
    const qty = Math.min(i.quantity, p.stock);
    return { productId: p.id, available: p.stock > 0, stock: p.stock, quantity: qty, priceCents: p.price_cents, lineTotal: p.price_cents * qty, name: p.name, slug: p.slug, unit: p.unit, imageUrl: p.image_url, emoji: p.emoji };
  });
  const priced = lines.filter((l) => l.available).map((l) => ({ product: byId.get(l.productId)!, quantity: l.quantity, lineTotal: l.lineTotal }));
  const subtotal = priced.reduce((s, l) => s + l.lineTotal, 0);
  const coupon = await applyCoupon(body.couponCode, subtotal);
  const totals = computeTotals(priced, coupon.discount, coupon.code, body.fulfillment ?? "delivery");
  return json({ lines, totals: { ...totals, couponError: coupon.error } });
});
