import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrderById, getOrderEvents, getOrderItems } from "@/lib/repo/orders";
import { OrderDetail } from "@/components/account/OrderDetail";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const user = (await getCurrentUser())!;
  const order = await getOrderById(Number((await params).id));
  if (!order || (order.user_id !== user.id && user.role !== "admin")) notFound();
  const [items, events] = await Promise.all([getOrderItems(order.id), getOrderEvents(order.id)]);
  return (
    <div className="space-y-4">
      <Link href="/account/orders" className="link text-sm">← All orders</Link>
      <OrderDetail order={order} items={items} events={events} canCancel={["pending", "confirmed", "processing"].includes(order.status)} />
    </div>
  );
}
