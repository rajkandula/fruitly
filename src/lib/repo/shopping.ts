import { db } from "../db";

export interface ShoppingLine {
  product_id: number | null; name: string; unit: string; qty: number; orders: number;
  source_store: string | null; cost_cents: number | null; revenue_cents: number;
}
export interface ShoppingRun {
  slot: string | null; label: string; orders: number; lines: ShoppingLine[];
  estCostCents: number; revenueCents: number;
}

const OPEN_STATUSES = "('pending','confirmed','processing')";

/**
 * What to buy for the orders that still need fulfilling, grouped by delivery/pickup window
 * and then by the store we source each item from. Internal use only.
 */
export async function shoppingRuns(): Promise<ShoppingRun[]> {
  const database = await db();
  const rows = await database.query<ShoppingLine & { slot: string | null; fulfillment_method: string }>(
    `SELECT o.delivery_slot AS slot, i.product_id, i.name, i.unit,
            SUM(i.quantity) AS qty, COUNT(DISTINCT o.id) AS orders,
            p.source_store, p.cost_cents, SUM(i.line_total_cents) AS revenue_cents,
            o.fulfillment_method
       FROM order_items i
       JOIN orders o ON o.id = i.order_id
       LEFT JOIN products p ON p.id = i.product_id
      WHERE o.status IN ${OPEN_STATUSES}
      GROUP BY o.delivery_slot, i.product_id, i.name, i.unit
      ORDER BY o.delivery_slot ASC, i.name ASC`);
  const bySlot = new Map<string, ShoppingRun>();
  for (const r of rows) {
    const key = r.slot ?? "unscheduled";
    if (!bySlot.has(key)) bySlot.set(key, { slot: r.slot, label: prettySlot(r.slot), orders: 0, lines: [], estCostCents: 0, revenueCents: 0 });
    const run = bySlot.get(key)!;
    run.lines.push({ product_id: r.product_id, name: r.name, unit: r.unit, qty: Number(r.qty), orders: Number(r.orders), source_store: r.source_store, cost_cents: r.cost_cents, revenue_cents: Number(r.revenue_cents) });
    run.estCostCents += (r.cost_cents ?? 0) * Number(r.qty);
    run.revenueCents += Number(r.revenue_cents);
  }
  const orderCounts = await database.query<{ slot: string | null; n: number }>(
    `SELECT delivery_slot AS slot, COUNT(*) AS n FROM orders WHERE status IN ${OPEN_STATUSES} GROUP BY delivery_slot`);
  for (const c of orderCounts) {
    const run = bySlot.get(c.slot ?? "unscheduled");
    if (run) run.orders = Number(c.n);
  }
  return [...bySlot.values()];
}

/** Orders belonging to a run, for the delivery walk. */
export async function runOrders(slot: string | null) {
  const database = await db();
  const where = slot ? "o.delivery_slot = ?" : "o.delivery_slot IS NULL";
  return database.query<{ id: number; order_number: string; fulfillment_method: string; shipping_name: string; shipping_line1: string; shipping_line2: string | null; shipping_phone: string | null; total_cents: number; payment_method: string; payment_status: string; substitution_pref: string; notes: string | null }>(
    `SELECT o.id, o.order_number, o.fulfillment_method, o.shipping_name, o.shipping_line1, o.shipping_line2, o.shipping_phone,
            o.total_cents, o.payment_method, o.payment_status, o.substitution_pref, o.notes
       FROM orders o WHERE o.status IN ${OPEN_STATUSES} AND ${where} ORDER BY o.shipping_line1`, slot ? [slot] : []);
}

export function prettySlot(slot: string | null): string {
  if (!slot) return "No window chosen";
  const [date, hour] = slot.split("_");
  const d = new Date(`${date}T00:00:00`);
  const h = Number(hour);
  const hl = (n: number) => `${n % 12 === 0 ? 12 : n % 12}${n >= 12 ? "pm" : "am"}`;
  return `${new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(d)}, from ${hl(h)}`;
}
