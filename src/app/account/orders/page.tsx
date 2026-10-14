import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { listOrdersForUser } from "@/lib/repo/orders";
import { formatDate, formatMoney } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
export default async function OrdersPage() {
  const user = (await getCurrentUser())!;
  const orders = await listOrdersForUser(user.id);
  return (
    <div className="card p-5">
      <h2 className="text-lg font-bold">Your orders</h2>
      {orders.length === 0 ? <p className="mt-3 text-sm text-gray-600">No orders yet. <Link href="/shop" className="link">Start shopping</Link></p> : (
        <div className="mt-3 overflow-x-auto"><table className="table">
          <thead><tr><th>Order</th><th>Date</th><th>Items</th><th>Payment</th><th>Status</th><th className="text-right">Total</th></tr></thead>
          <tbody>{orders.map((o) => (
            <tr key={o.id}><td><Link href={`/account/orders/${o.id}`} className="font-mono font-semibold hover:text-leaf-800">{o.order_number}</Link></td><td className="whitespace-nowrap text-gray-600">{formatDate(o.created_at)}</td><td>{o.item_count}</td><td><span className="text-xs uppercase text-gray-500">{o.payment_method}</span> <OrderStatusBadge status={o.payment_status} /></td><td><OrderStatusBadge status={o.status} /></td><td className="text-right font-semibold tabular-nums">{formatMoney(o.total_cents)}</td></tr>
          ))}</tbody></table></div>
      )}
    </div>
  );
}
