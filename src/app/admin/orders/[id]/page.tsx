import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderById, getOrderEvents, getOrderItems } from "@/lib/repo/orders";
import { OrderDetail } from "@/components/account/OrderDetail";
import { AdminOrderControls } from "@/components/admin/AdminOrderControls";
export default async function AdminOrder({ params }: { params: Promise<{ id: string }> }) {
  const order = await getOrderById(Number((await params).id));
  if (!order) notFound();
  const [items, events] = await Promise.all([getOrderItems(order.id), getOrderEvents(order.id)]);
  return (
    <div className="space-y-4">
      <Link href="/admin/orders" className="link text-sm">← All orders</Link>
      <AdminOrderControls order={order} />
      <OrderDetail order={order} items={items} events={events} canCancel={false} />
    </div>
  );
}
