import { handler, json, parseBody, requireVerifiedUser } from "@/lib/api";
import { checkoutSchema } from "@/lib/validation";
import { placeOrder } from "@/lib/checkout";

/** Places an order. For card payments returns a `redirectUrl` to the hosted Stripe checkout. */
export const POST = handler(async (req) => {
  const user = await requireVerifiedUser();
  const body = await parseBody(req, checkoutSchema);
  const { order, redirectUrl } = await placeOrder(user, body);
  return json({ ok: true, orderId: order.id, orderNumber: order.order_number, status: order.status, paymentStatus: order.payment_status, redirectUrl }, { status: 201 });
});
