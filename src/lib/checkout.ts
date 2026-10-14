import { ApiError } from "./api";
import { db } from "./db";
import { env } from "./env";
import { sendMail } from "./mail";
import { adminNewOrderTemplate, orderConfirmationTemplate } from "./mail/templates";
import { cardPaymentsEnabled, createCheckoutSession } from "./payments";
import { createAddress, getAddress } from "./repo/addresses";
import { couponDiscount, findCoupon, incrementCouponUse } from "./repo/coupons";
import { addOrderEvent, getOrderById, getOrderItems } from "./repo/orders";
import { adjustStock, getProductsByIds } from "./repo/products";
import type { Address, Order, OrderItem, Product, User } from "./types";
import { orderNumber } from "./utils";
import { isValidSlot, servesPostal, outOfZoneMessage, slotLabel } from "./delivery";
import type { z } from "zod";
import type { checkoutSchema } from "./validation";

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export interface PricedLine { product: Product; quantity: number; lineTotal: number }
export interface Totals { subtotal: number; shipping: number; tax: number; discount: number; serviceFee: number; total: number; couponCode: string | null; couponError?: string }

export function computeTotals(lines: PricedLine[], discount = 0, couponCode: string | null = null, fulfillment: "delivery" | "pickup" = "delivery"): Totals {
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const afterDiscount = Math.max(0, subtotal - discount);
  const shipping = fulfillment === "pickup" || afterDiscount === 0 || afterDiscount >= env.freeShippingOverCents ? 0 : env.shippingFlatCents;
  const tax = Math.round(afterDiscount * env.taxRate);
  const serviceFee = afterDiscount === 0 ? 0 : env.serviceFeeCents;
  return { subtotal, shipping, tax, discount, serviceFee, total: afterDiscount + shipping + tax + serviceFee, couponCode };
}

/** Re-prices cart lines from the database (never trust client prices) and checks stock. */
export async function priceCart(items: { productId: number; quantity: number }[]): Promise<PricedLine[]> {
  const merged = new Map<number, number>();
  for (const it of items) merged.set(it.productId, (merged.get(it.productId) ?? 0) + it.quantity);
  const products = await getProductsByIds([...merged.keys()]);
  const byId = new Map(products.map((p) => [p.id, p]));
  const lines: PricedLine[] = [];
  for (const [productId, quantity] of merged) {
    const p = byId.get(productId);
    if (!p || !p.is_active) throw new ApiError(409, `An item in your cart is no longer available.`);
    if (!env.madeToOrder && p.stock < quantity) throw new ApiError(409, `Only ${p.stock} × ${p.name} left in stock.`);
    lines.push({ product: p, quantity, lineTotal: p.price_cents * quantity });
  }
  return lines;
}

export async function applyCoupon(code: string | null | undefined, subtotal: number): Promise<{ discount: number; code: string | null; error?: string }> {
  if (!code) return { discount: 0, code: null };
  const c = await findCoupon(code);
  if (!c) return { discount: 0, code: null, error: "That coupon code isn't valid." };
  const r = couponDiscount(c, subtotal);
  if (!r.ok) return { discount: 0, code: null, error: r.reason };
  return { discount: r.discountCents, code: c.code };
}

export async function placeOrder(user: User, input: CheckoutInput): Promise<{ order: Order; items: OrderItem[]; redirectUrl: string | null }> {
  if (input.paymentMethod === "card" && !(await cardPaymentsEnabled())) throw new ApiError(400, "Card payments are not available right now. Please choose cash on delivery.");
  if (input.paymentMethod === "cod" && !env.codEnabled) throw new ApiError(400, "Cash on delivery is not available.");

  const fulfillment = input.fulfillment ?? "delivery";
  if (fulfillment === "pickup" && !env.pickupEnabled) throw new ApiError(400, "Local pickup isn't available right now.");
  if (input.slot && !isValidSlot(input.slot)) throw new ApiError(422, "That time slot is no longer available — please pick another.");

  // Pickup orders don't need a delivery address; we record the pickup location instead.
  if (fulfillment === "pickup") {
    const name = (input.contactName ?? user.name).trim();
    const lines = await priceCart(input.items);
    return finishOrder({
      user, input, fulfillment, lines,
      addr: { id: 0, user_id: user.id, created_at: "", is_default: 0, label: "Pickup", full_name: name,
        line1: env.pickupLocation || "Store pickup", line2: null, city: env.deliveryAreaName, state: "", postal_code: "", country: "US", phone: input.contactPhone ?? user.phone ?? null },
    });
  }

  // Resolve shipping address
  let addr = input.addressId ? await getAddress(user.id, input.addressId) : null;
  if (!addr && input.address) {
    addr = input.saveAddress ? await createAddress(user.id, input.address) : {
      id: 0, user_id: user.id, created_at: "", is_default: 0,
      label: input.address.label ?? "Home", full_name: input.address.full_name, line1: input.address.line1, line2: input.address.line2 ?? null,
      city: input.address.city, state: input.address.state ?? "", postal_code: input.address.postal_code, country: input.address.country ?? "US", phone: input.address.phone ?? null,
    };
  }
  if (!addr) throw new ApiError(422, "Please provide a shipping address.");
  if (!servesPostal(addr.postal_code)) throw new ApiError(422, outOfZoneMessage());

  const lines = await priceCart(input.items);
  return finishOrder({ user, input, fulfillment, lines, addr });
}

async function finishOrder({ user, input, fulfillment, lines, addr }: { user: User; input: CheckoutInput; fulfillment: "delivery" | "pickup"; lines: PricedLine[]; addr: Address }): Promise<{ order: Order; items: OrderItem[]; redirectUrl: string | null }> {
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const coupon = await applyCoupon(input.couponCode, subtotal);
  if (coupon.error) throw new ApiError(422, coupon.error);
  const totals = computeTotals(lines, coupon.discount, coupon.code, fulfillment);

  // Reserve stock (atomic per product; roll back on failure). Skipped in made-to-order mode,
  // where we buy each order fresh after it is placed.
  const reserved: PricedLine[] = [];
  if (!env.madeToOrder) {
    for (const l of lines) {
      const ok = await adjustStock(l.product.id, -l.quantity);
      if (!ok) {
        for (const r of reserved) await adjustStock(r.product.id, r.quantity);
        throw new ApiError(409, `Sorry, ${l.product.name} just sold out.`);
      }
      reserved.push(l);
    }
  }

  const database = await db();
  const number = orderNumber();
  let orderId: number;
  try {
    const res = await database.run(
      `INSERT INTO orders (order_number, user_id, email, status, payment_method, payment_status, payment_provider,
         subtotal_cents, shipping_cents, tax_cents, discount_cents, total_cents, currency, coupon_code,
         shipping_name, shipping_line1, shipping_line2, shipping_city, shipping_state, shipping_postal_code, shipping_country, shipping_phone, notes,
         fulfillment_method, delivery_slot, substitution_pref, service_fee_cents)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [number, user.id, user.email, input.paymentMethod === "cod" ? "confirmed" : "pending", input.paymentMethod, "unpaid",
        input.paymentMethod === "card" ? "harakumo-stripe" : "cod",
        totals.subtotal, totals.shipping, totals.tax, totals.discount, totals.total, env.currency, totals.couponCode,
        addr.full_name, addr.line1, addr.line2, addr.city, addr.state, addr.postal_code, addr.country, addr.phone, input.notes ?? null,
        fulfillment, input.slot ?? null, input.substitutionPref ?? "contact", totals.serviceFee]);
    orderId = res.lastRowId;
    for (const l of lines) {
      await database.run(
        "INSERT INTO order_items (order_id, product_id, name, unit, unit_price_cents, quantity, line_total_cents, image_url, emoji) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [orderId, l.product.id, l.product.name, l.product.unit, l.product.price_cents, l.quantity, l.lineTotal, l.product.image_url, l.product.emoji]);
    }
    const when = slotLabel(input.slot);
    const how = fulfillment === "pickup" ? "for pickup" : "for delivery";
    await addOrderEvent(orderId, input.paymentMethod === "cod" ? "confirmed" : "pending",
      `${input.paymentMethod === "cod" ? "Order placed (cash on " + (fulfillment === "pickup" ? "pickup" : "delivery") + ")" : "Order placed, awaiting card payment"}${when ? ` — scheduled ${how}: ${when}` : ""}`);
    if (totals.couponCode) await incrementCouponUse(totals.couponCode);
  } catch (err) {
    for (const r of reserved) await adjustStock(r.product.id, r.quantity);
    throw err;
  }

  let redirectUrl: string | null = null;
  if (input.paymentMethod === "card") {
    try {
      const session = await createCheckoutSession({ orderNumber: number, amountCents: totals.total, email: user.email, description: `${env.appName} order ${number}` });
      await database.run("UPDATE orders SET payment_session_id = ?, payment_url = ? WHERE id = ?", [session.sessionId, session.url, orderId]);
      redirectUrl = session.url;
      if (!redirectUrl) await addOrderEvent(orderId, "payment_error", "Payment provider did not return a checkout URL");
    } catch (err) {
      // Release stock and cancel the order so the customer can retry.
      for (const r of reserved) await adjustStock(r.product.id, r.quantity);
      await database.run("UPDATE orders SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?", [orderId]);
      await addOrderEvent(orderId, "cancelled", `Payment session failed: ${err instanceof Error ? err.message : "unknown error"}`);
      throw new ApiError(502, "We couldn't start the card payment. Please try again or choose cash on delivery.");
    }
  }

  const order = (await getOrderById(orderId))!;
  const items = await getOrderItems(orderId);
  // Confirmation is sent now for COD; for card it's sent once payment is confirmed.
  if (input.paymentMethod === "cod") void notifyOrderPlaced(order, items);
  return { order, items, redirectUrl };
}

export async function notifyOrderPlaced(order: Order, items: OrderItem[]) {
  const t = orderConfirmationTemplate(order, items);
  await sendMail({ to: order.email, ...t });
  const a = adminNewOrderTemplate(order, items);
  await Promise.all(env.adminEmails.filter((e) => e !== order.email).map((to) => sendMail({ to, ...a })));
}

/** Cancels an order (customer or admin) and restores stock. */
export async function cancelOrder(order: Order, note: string): Promise<Order> {
  if (order.status === "cancelled") return order;
  const items = await getOrderItems(order.id);
  if (!env.madeToOrder) for (const i of items) if (i.product_id) await adjustStock(i.product_id, i.quantity);
  const database = await db();
  await database.run("UPDATE orders SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?", [order.id]);
  await addOrderEvent(order.id, "cancelled", note);
  return (await getOrderById(order.id))!;
}
