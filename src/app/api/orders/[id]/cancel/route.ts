import { handler, json, fail, requireUser } from "@/lib/api";
import { getOrderById } from "@/lib/repo/orders";
import { cancelOrder } from "@/lib/checkout";
import { sendMail } from "@/lib/mail";
import { orderStatusTemplate } from "@/lib/mail/templates";

/** Customers may cancel while the order hasn't shipped. */
export const POST = handler<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  const user = await requireUser();
  const order = await getOrderById(Number((await params).id));
  if (!order || order.user_id !== user.id) return fail(404, "Order not found");
  if (!["pending", "confirmed", "processing"].includes(order.status)) return fail(400, "This order can no longer be cancelled.");
  const updated = await cancelOrder(order, "Cancelled by customer");
  void sendMail({ to: updated.email, ...orderStatusTemplate(updated, "Your order was cancelled as requested. Any card payment will be refunded.") });
  return json({ ok: true, order: updated });
});
