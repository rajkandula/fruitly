import { z } from "zod";
import { handler, json, fail, parseBody, requireUser } from "@/lib/api";
import { getOrderByNumber, getOrderItems, setPaymentStatus } from "@/lib/repo/orders";
import { verifyCheckoutSession } from "@/lib/payments";
import { env } from "@/lib/env";
import { notifyOrderPlaced } from "@/lib/checkout";

/**
 * Called from the checkout success page after Stripe redirects back.
 * Confirms payment using the provider's session record when available; otherwise (optionally) trusts the redirect.
 */
export const POST = handler(async (req) => {
  const user = await requireUser();
  const { orderNumber } = await parseBody(req, z.object({ orderNumber: z.string().trim().min(3).max(40) }));
  const order = await getOrderByNumber(orderNumber);
  if (!order || (order.user_id !== user.id && user.role !== "admin")) return fail(404, "Order not found");
  if (order.payment_method !== "card") return json({ order });
  if (order.payment_status === "paid") return json({ order });

  const verified = await verifyCheckoutSession(order.payment_session_id, order.order_number);
  if (verified === true || (verified === null && env.paymentsTrustSuccessRedirect)) {
    const updated = await setPaymentStatus(order.id, "paid", { verified: verified === true, note: verified ? "Payment confirmed by provider" : "Payment assumed from success redirect" });
    if (updated) void notifyOrderPlaced(updated, await getOrderItems(updated.id));
    return json({ order: updated, confirmed: true });
  }
  return json({ order, confirmed: false, pending: true });
});
