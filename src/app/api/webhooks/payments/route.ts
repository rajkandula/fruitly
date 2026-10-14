import { timingSafeEqual } from "node:crypto";
import { handler, json, fail } from "@/lib/api";
import { env } from "@/lib/env";
import { getOrderByNumber, getOrderItems, setPaymentStatus } from "@/lib/repo/orders";
import { notifyOrderPlaced } from "@/lib/checkout";

/**
 * Payment webhook (Stripe-style event envelope). Configure PAYMENTS_WEBHOOK_SECRET and send it in `x-webhook-secret`.
 * Looks up the order from metadata.order_number / client_reference_id / description and marks it paid.
 */
export const POST = handler(async (req) => {
  const secret = env.paymentsWebhookSecret;
  if (!secret) return fail(503, "Webhook not configured");
  const provided = req.headers.get("x-webhook-secret") ?? "";
  const a = Buffer.from(provided), b = Buffer.from(secret);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return fail(401, "Invalid signature");

  const evt = (await req.json().catch(() => null)) as { type?: string; data?: { object?: Record<string, unknown> } } | null;
  const obj = evt?.data?.object ?? {};
  const meta = (obj.metadata ?? {}) as Record<string, unknown>;
  const orderNumber = String(meta.order_number ?? obj.client_reference_id ?? "").trim()
    || (String(obj.description ?? "").match(/FR-[A-Z0-9]+/)?.[0] ?? "");
  if (!orderNumber) return json({ received: true, ignored: "no order reference" });
  const order = await getOrderByNumber(orderNumber);
  if (!order) return json({ received: true, ignored: "unknown order" });

  const type = String(evt?.type ?? "");
  const paid = type === "checkout.session.completed" || type === "payment_intent.succeeded" || String(obj.payment_status) === "paid";
  const failed = type.endsWith(".failed") || type === "checkout.session.expired";
  if (paid && order.payment_status !== "paid") {
    const updated = await setPaymentStatus(order.id, "paid", { verified: true, sessionId: obj.id ? String(obj.id) : null, note: `Webhook ${type}` });
    if (updated) void notifyOrderPlaced(updated, await getOrderItems(updated.id));
  } else if (failed && order.payment_status === "unpaid") {
    await setPaymentStatus(order.id, "failed", { note: `Webhook ${type}` });
  }
  return json({ received: true });
});
