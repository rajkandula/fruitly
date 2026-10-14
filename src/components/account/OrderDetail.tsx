"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate, formatMoney } from "@/lib/utils";
import type { Order, OrderEvent, OrderItem } from "@/lib/types";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { useToast } from "../Toaster";
import { ReorderButton } from "./ReorderButton";

const STEPS = ["confirmed", "processing", "shipped", "delivered"];

export function OrderDetail({ order, items, events, canCancel }: { order: Order; items: OrderItem[]; events: OrderEvent[]; canCancel: boolean }) {
  const [busy, setBusy] = useState(false); const { toast } = useToast(); const router = useRouter();
  const stepIdx = order.status === "cancelled" ? -1 : order.status === "pending" ? -0.5 : STEPS.indexOf(order.status);
  const cancel = async () => {
    if (!confirm("Cancel this order?")) return; setBusy(true);
    const res = await fetch(`/api/orders/${order.id}/cancel`, { method: "POST" }); const d = await res.json(); setBusy(false);
    if (!res.ok) { toast(d.error ?? "Could not cancel", "error"); return; }
    toast("Order cancelled"); router.refresh();
  };
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="font-mono text-xl font-bold">{order.order_number}</h2><p className="text-sm text-gray-500">Placed {formatDate(order.created_at)}</p></div>
            <div className="flex items-center gap-2"><OrderStatusBadge status={order.status} /><OrderStatusBadge status={order.payment_status} /></div>
          </div>
          {order.status !== "cancelled" && (
            <ol className="mt-6 grid grid-cols-4 gap-2 text-center text-xs">
              {STEPS.map((s, i) => <li key={s} className="flex flex-col items-center gap-1"><span className={`grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold ${i <= stepIdx ? "bg-leaf-700 text-white" : "bg-gray-100 text-gray-400"}`}>{i + 1}</span><span className={`capitalize ${i <= stepIdx ? "font-semibold text-ink" : "text-gray-400"}`}>{s}</span></li>)}
            </ol>
          )}
          {order.payment_method === "card" && order.payment_status === "unpaid" && order.payment_url && order.status === "pending" && (
            <a href={order.payment_url} className="btn-accent mt-5">Complete payment</a>
          )}
          <ul className="mt-6 divide-y divide-line">
            {items.map((i) => <li key={i.id} className="flex items-center gap-3 py-3 text-sm"><span className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl bg-leaf-50">{i.image_url ? <img src={i.image_url} alt="" className="h-full w-full object-cover" /> : null}</span><div className="flex-1"><p className="font-medium">{i.name}</p><p className="text-xs text-gray-500">{formatMoney(i.unit_price_cents)} / {i.unit} × {i.quantity}</p></div><span className="font-semibold tabular-nums">{formatMoney(i.line_total_cents)}</span></li>)}
          </ul>
          <dl className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
            <div className="flex justify-between"><dt className="text-gray-600">Subtotal</dt><dd>{formatMoney(order.subtotal_cents)}</dd></div>
            {order.discount_cents > 0 && <div className="flex justify-between text-leaf-700"><dt>Discount {order.coupon_code && `(${order.coupon_code})`}</dt><dd>−{formatMoney(order.discount_cents)}</dd></div>}
            <div className="flex justify-between"><dt className="text-gray-600">Shipping</dt><dd>{order.shipping_cents ? formatMoney(order.shipping_cents) : "Free"}</dd></div>
            {order.tax_cents > 0 && <div className="flex justify-between"><dt className="text-gray-600">Tax</dt><dd>{formatMoney(order.tax_cents)}</dd></div>}
            <div className="flex justify-between text-base font-bold"><dt>Total</dt><dd>{formatMoney(order.total_cents)}</dd></div>
          </dl>
        </div>
        <div className="card p-5"><h3 className="font-bold">History</h3><ul className="mt-3 space-y-2 text-sm">{events.map((e) => <li key={e.id} className="flex gap-3"><span className="w-36 shrink-0 text-xs text-gray-500">{formatDate(e.created_at)}</span><span><b className="capitalize">{e.status.replace("_", " ")}</b>{e.note && <span className="text-gray-600"> — {e.note}</span>}</span></li>)}</ul></div>
      </div>
      <div className="space-y-4">
        <div className="card p-5 text-sm"><h3 className="font-bold">{order.fulfillment_method === "pickup" ? "Pickup" : "Delivery address"}</h3><address className="mt-2 not-italic text-gray-700">{order.shipping_name}<br />{order.shipping_line1}<br />{order.shipping_line2 && <>{order.shipping_line2}<br /></>}{order.shipping_city}{order.shipping_state && `, ${order.shipping_state}`} {order.shipping_postal_code}<br />{order.shipping_country}{order.shipping_phone && <><br />{order.shipping_phone}</>}</address>{order.delivery_slot && <p className="mt-3 rounded-xl bg-leaf-50 p-2 text-xs"><b>{order.fulfillment_method === "pickup" ? "Pickup" : "Delivery"} window:</b> {order.delivery_slot.replace(/_/g, " ")}</p>}
          {order.notes && <p className="mt-3 rounded-xl bg-leaf-50 p-2 text-xs">Note: {order.notes}</p>}</div>
        <div className="card p-5 text-sm"><h3 className="font-bold">Payment</h3><p className="mt-2 text-gray-700">{order.payment_method === "cod" ? (order.fulfillment_method === "pickup" ? "Cash on pickup" : "Cash on delivery") : "Card via Stripe"} · <span className="capitalize">{order.payment_status}</span>{order.paid_at && <><br /><span className="text-xs text-gray-500">Paid {formatDate(order.paid_at)}</span></>}</p></div>
        <ReorderButton items={items} />
        {canCancel && <button onClick={cancel} disabled={busy} className="btn-secondary w-full text-red-700 hover:border-red-300">Cancel order</button>}
      </div>
    </div>
  );
}
