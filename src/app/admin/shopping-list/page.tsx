import Link from "next/link";
import { ShoppingBasket, Printer } from "lucide-react";
import { shoppingRuns, runOrders, prettySlot } from "@/lib/repo/shopping";
import { formatMoney } from "@/lib/utils";
import { env } from "@/lib/env";

export const metadata = { title: "Shopping list" };

/** Internal buying + delivery sheet: what to buy, where, and where it goes. */
export default async function ShoppingListPage() {
  const runs = await shoppingRuns();
  const withOrders = await Promise.all(runs.map(async (r) => ({ run: r, orders: await runOrders(r.slot) })));
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold"><ShoppingBasket className="h-5 w-5 text-leaf-700" />Shopping list</h2>
          <p className="text-sm text-gray-600">Everything you need to buy for orders that still need fulfilling, grouped by {env.madeToOrder ? "run and store" : "delivery window"}. Internal only — customers never see this.</p>
        </div>
        <span className="text-xs text-gray-500"><Printer className="mr-1 inline h-3.5 w-3.5" />Tip: print this page for the walk</span>
      </div>

      {withOrders.length === 0 && <div className="card p-10 text-center text-sm text-gray-600">No open orders right now.</div>}

      {withOrders.map(({ run, orders }) => {
        const byStore = new Map<string, typeof run.lines>();
        for (const l of run.lines) {
          const k = l.source_store || "Unassigned";
          byStore.set(k, [...(byStore.get(k) ?? []), l]);
        }
        const margin = run.revenueCents - run.estCostCents;
        return (
          <section key={run.slot ?? "none"} className="card p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-3">
              <h3 className="text-lg font-bold">{prettySlot(run.slot)}</h3>
              <p className="text-sm text-gray-600">
                {run.orders} order{run.orders === 1 ? "" : "s"} · revenue <b className="text-ink">{formatMoney(run.revenueCents)}</b>
                {run.estCostCents > 0 && <> · est. cost {formatMoney(run.estCostCents)} · <b className={margin >= 0 ? "text-leaf-700" : "text-red-600"}>margin {formatMoney(margin)}</b></>}
              </p>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Buy</h4>
                {[...byStore.entries()].map(([store, lines]) => (
                  <div key={store} className="mt-3">
                    <p className="text-sm font-semibold">{store}</p>
                    <ul className="mt-1 space-y-1 text-sm">
                      {lines.map((l) => (
                        <li key={`${l.product_id}-${l.name}`} className="flex items-baseline justify-between gap-3 border-b border-line/60 py-1">
                          <span><b className="tabular-nums">{l.qty}</b> × {l.name} <span className="text-xs text-gray-500">({l.unit}{l.orders > 1 ? `, ${l.orders} orders` : ""})</span></span>
                          <span className="whitespace-nowrap text-xs text-gray-500">{l.cost_cents ? `${formatMoney(l.cost_cents * l.qty)} cost` : "cost not set"}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Deliver / hand over</h4>
                <ul className="mt-3 space-y-2 text-sm">
                  {orders.map((o) => (
                    <li key={o.id} className="rounded-xl border border-line p-3">
                      <div className="flex items-center justify-between gap-2">
                        <Link href={`/admin/orders/${o.id}`} className="font-mono text-xs font-semibold hover:text-leaf-800">{o.order_number}</Link>
                        <span className="text-xs">{o.payment_method === "cod" ? <b className="text-amber-700">Collect {formatMoney(o.total_cents)}</b> : <span className="text-leaf-700">Paid by card</span>}</span>
                      </div>
                      <p className="mt-1">{o.fulfillment_method === "pickup" ? <span className="badge bg-blue-100 text-blue-800">Pickup</span> : null} {o.shipping_name} — {o.shipping_line1}{o.shipping_line2 ? `, ${o.shipping_line2}` : ""}</p>
                      {o.shipping_phone && <p className="text-xs text-gray-500">{o.shipping_phone}</p>}
                      <p className="mt-1 text-xs text-gray-600">If out of stock: <b>{o.substitution_pref === "substitute" ? "substitute something similar" : o.substitution_pref === "refund" ? "refund that item" : "contact the customer"}</b></p>
                      {o.notes && <p className="mt-1 text-xs italic text-gray-600">“{o.notes}”</p>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
