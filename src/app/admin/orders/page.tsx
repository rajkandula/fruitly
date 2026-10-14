import Link from "next/link";
import { listAllOrders } from "@/lib/repo/orders";
import { formatDate, formatMoney } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { cn } from "@/lib/utils";
const STATUSES = ["", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status = "", q } = await searchParams;
  const { orders, total } = await listAllOrders({ status: status || undefined, q });
  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-bold">Orders <span className="text-sm font-normal text-gray-500">({total})</span></h2>
        <form className="flex gap-2"><input name="q" defaultValue={q} placeholder="Order #, email, name…" className="input py-1.5" />{status && <input type="hidden" name="status" value={status} />}<button className="btn-secondary btn-sm">Search</button></form></div>
      <div className="mt-3 flex flex-wrap gap-1.5">{STATUSES.map((s) => <Link key={s} href={`/admin/orders${s ? `?status=${s}` : ""}`} className={cn("badge border px-3 py-1 capitalize", status === s ? "border-leaf-800 bg-leaf-800 text-white" : "border-line bg-white")}>{s || "All"}</Link>)}</div>
      <div className="mt-4 overflow-x-auto"><table className="table"><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Payment</th><th>Status</th><th className="text-right">Total</th></tr></thead>
        <tbody>{orders.map((o) => <tr key={o.id}><td><Link href={`/admin/orders/${o.id}`} className="font-mono font-semibold hover:text-leaf-800">{o.order_number}</Link><p className="text-xs text-gray-500">{formatDate(o.created_at)}</p></td><td>{o.shipping_name}<p className="text-xs text-gray-500">{o.email}</p></td><td>{o.item_count}</td><td><span className="text-xs uppercase text-gray-500">{o.payment_method}</span> <OrderStatusBadge status={o.payment_status} /></td><td><OrderStatusBadge status={o.status} /></td><td className="text-right font-semibold tabular-nums">{formatMoney(o.total_cents)}</td></tr>)}
        {orders.length === 0 && <tr><td colSpan={6} className="text-center text-gray-500">No orders</td></tr>}</tbody></table></div>
    </div>
  );
}
