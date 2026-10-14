import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { listOrdersForUser } from "@/lib/repo/orders";
import { listAddresses } from "@/lib/repo/addresses";
import { formatDate, formatMoney } from "@/lib/utils";
import { ProfileForm } from "@/components/account/ProfileForm";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";

export default async function AccountPage() {
  const user = (await getCurrentUser())!;
  const [orders, addresses] = await Promise.all([listOrdersForUser(user.id), listAddresses(user.id)]);
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5"><p className="text-xs uppercase tracking-wide text-gray-500">Orders</p><p className="mt-1 text-3xl font-bold">{orders.length}</p></div>
        <div className="card p-5"><p className="text-xs uppercase tracking-wide text-gray-500">Total spent</p><p className="mt-1 text-3xl font-bold">{formatMoney(orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total_cents, 0))}</p></div>
        <div className="card p-5"><p className="text-xs uppercase tracking-wide text-gray-500">Addresses</p><p className="mt-1 text-3xl font-bold">{addresses.length}</p></div>
      </div>
      <div className="card p-5">
        <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Recent orders</h2><Link href="/account/orders" className="link text-sm">View all</Link></div>
        {orders.length === 0 ? <p className="mt-3 text-sm text-gray-600">No orders yet. <Link href="/shop" className="link">Start shopping</Link></p> : (
          <ul className="mt-3 divide-y divide-line">{orders.slice(0, 5).map((o) => (
            <li key={o.id} className="flex items-center justify-between gap-3 py-3 text-sm"><div><Link href={`/account/orders/${o.id}`} className="font-mono font-semibold hover:text-leaf-800">{o.order_number}</Link><p className="text-xs text-gray-500">{formatDate(o.created_at)} · {o.item_count} items</p></div><div className="flex items-center gap-3"><OrderStatusBadge status={o.status} /><span className="font-semibold tabular-nums">{formatMoney(o.total_cents)}</span></div></li>
          ))}</ul>
        )}
      </div>
      <div className="card p-5"><h2 className="text-lg font-bold">Profile</h2><ProfileForm user={{ name: user.name, email: user.email, phone: user.phone }} /></div>
    </div>
  );
}
