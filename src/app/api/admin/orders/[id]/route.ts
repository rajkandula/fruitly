import { handler, json, fail, parseBody, requireAdmin } from "@/lib/api";
import { orderStatusSchema } from "@/lib/validation";
import { getOrderById, getOrderEvents, getOrderItems, setOrderStatus, setPaymentStatus } from "@/lib/repo/orders";
import { cancelOrder, notifyOrderPlaced } from "@/lib/checkout";
import { sendMail } from "@/lib/mail";
import { orderStatusTemplate } from "@/lib/mail/templates";

type Ctx = { params: Promise<{ id: string }> };
export const GET = handler<Ctx>(async (_req, { params }) => {
  await requireAdmin();
  const order = await getOrderById(Number((await params).id));
  if (!order) return fail(404, "Order not found");
  return json({ order, items: await getOrderItems(order.id), events: await getOrderEvents(order.id) });
});
/** Update fulfilment status and/or payment status; emails the customer on status changes when `notify` is true. */
export const PATCH = handler<Ctx>(async (req, { params }) => {
  await requireAdmin();
  const id = Number((await params).id);
  let order = await getOrderById(id);
  if (!order) return fail(404, "Order not found");
  const body = await parseBody(req, orderStatusSchema);
  if (body.paymentStatus && body.paymentStatus !== order.payment_status) {
    const wasUnpaid = order.payment_status !== "paid";
    order = (await setPaymentStatus(id, body.paymentStatus, { verified: true, note: body.note ?? "Updated by admin" }))!;
    if (body.paymentStatus === "paid" && wasUnpaid && order.payment_method === "card") void notifyOrderPlaced(order, await getOrderItems(id));
  }
  if (body.status && body.status !== order.status) {
    order = body.status === "cancelled" ? await cancelOrder(order, body.note ?? "Cancelled by admin") : (await setOrderStatus(id, body.status, body.note))!;
    if (body.notify) void sendMail({ to: order.email, ...orderStatusTemplate(order, body.note) });
  }
  return json({ order, items: await getOrderItems(id), events: await getOrderEvents(id) });
});
