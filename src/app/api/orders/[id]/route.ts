import { handler, json, fail, requireUser } from "@/lib/api";
import { getOrderById, getOrderEvents, getOrderItems } from "@/lib/repo/orders";

export const GET = handler<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  const user = await requireUser();
  const order = await getOrderById(Number((await params).id));
  if (!order || (order.user_id !== user.id && user.role !== "admin")) return fail(404, "Order not found");
  return json({ order, items: await getOrderItems(order.id), events: await getOrderEvents(order.id) });
});
