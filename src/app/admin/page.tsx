import Link from "next/link";
import { adminStats } from "@/lib/repo/orders";
import { formatDate, formatMoney } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { paymentsReadiness } from "@/lib/payments";
import { PaymentsCard } from "@/components/admin/PaymentsCard";
import { storageEnabled } from "@/lib/storage";
import { env } from "@/lib/env";

export default async function AdminHome() {
  const [s, pay] = await Promise.all([adminStats(), paymentsReadiness()]);
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[["Revenue", formatMoney(s.revenueCents)], ["Orders", String(s.orders)], ["Customers", String(s.users)], ["Active products", String(s.products)]].map(([k, v]) => (
          <div key={k} className="card p-5"><p className="text-xs uppercase tracking-wide text-gray-500">{k}</p><p className="mt-1 text-3xl font-bold tabular-nums">{v}</p></div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Recent orders</h2><Link href="/admin/orders" className="link text-sm">All orders</Link></div>
          <div className="mt-3 overflow-x-auto"><table className="table"><thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Payment</th><th className="text-right">Total</th></tr></thead>
            <tbody>{s.recent.map((o) => <tr key={o.id}><td><Link href={`/admin/orders/${o.id}`} className="font-mono font-semibold hover:text-leaf-800">{o.order_number}</Link><p className="text-xs text-gray-500">{formatDate(o.created_at)}</p></td><td className="text-gray-700">{o.shipping_name}<p className="text-xs text-gray-500">{o.email}</p></td><td><OrderStatusBadge status={o.status} /></td><td><span className="text-xs uppercase text-gray-500">{o.payment_method}</span> <OrderStatusBadge status={o.payment_status} /></td><td className="text-right font-semibold tabular-nums">{formatMoney(o.total_cents)}</td></tr>)}
            {s.recent.length === 0 && <tr><td colSpan={5} className="text-center text-gray-500">No orders yet</td></tr>}</tbody></table></div>
        </div>
        <div className="space-y-4">
          <div className="card p-5"><h2 className="text-lg font-bold">Orders by status</h2><ul className="mt-3 space-y-1.5 text-sm">{s.byStatus.map((b) => <li key={b.status} className="flex justify-between"><OrderStatusBadge status={b.status} /><b className="tabular-nums">{b.n}</b></li>)}{s.byStatus.length === 0 && <li className="text-gray-500">—</li>}</ul></div>
          <div className="card p-5"><h2 className="text-lg font-bold">Low stock</h2><ul className="mt-3 space-y-1.5 text-sm">{s.lowStock.map((p) => <li key={p.id} className="flex justify-between"><Link href={`/admin/products/${p.id}`} className="hover:text-leaf-800">{p.name}</Link><b className={p.stock === 0 ? "text-red-600" : "text-amber-700"}>{p.stock}</b></li>)}{s.lowStock.length === 0 && <li className="text-gray-500">All good</li>}</ul></div>
          <PaymentsCard initial={pay} cod={env.codEnabled} />
          <div className="card p-5 text-sm"><h2 className="text-lg font-bold">Integrations</h2>
            <ul className="mt-3 space-y-1.5">
              <li className="flex justify-between"><span>Database</span><span className="font-medium text-leaf-800">Harakumo Edge SQLite ✓</span></li>
              <li className="flex justify-between"><span>Mail</span><span className="font-medium text-leaf-800">{env.mailMode === "harakumo" ? "Harakumo Mail ✓" : "Dev mode"}</span></li>
              <li className="flex justify-between"><span>Image storage</span><span className={storageEnabled() ? "font-medium text-leaf-800" : "font-medium text-amber-700"}>{storageEnabled() ? "Harakumo Storage ✓" : "Not enabled"}</span></li>
              <li className="flex justify-between"><span>AI gateway</span><span className="font-medium text-leaf-800">{env.harakumoAiEnabled ? "On" : "Off"}</span></li>
            </ul></div>
        </div>
      </div>
    </div>
  );
}
