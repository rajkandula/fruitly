import { db } from "../db";
import type { Order, OrderEvent, OrderItem, OrderStatus, PaymentStatus } from "../types";

export async function getOrderById(id: number): Promise<Order | null> {
  const database = await db();
  return database.get<Order>("SELECT * FROM orders WHERE id = ?", [id]);
}
export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  const database = await db();
  return database.get<Order>("SELECT * FROM orders WHERE order_number = ?", [orderNumber]);
}
export async function getOrderItems(orderId: number): Promise<OrderItem[]> {
  const database = await db();
  return database.query<OrderItem>("SELECT * FROM order_items WHERE order_id = ? ORDER BY id", [orderId]);
}
export async function getOrderEvents(orderId: number): Promise<OrderEvent[]> {
  const database = await db();
  return database.query<OrderEvent>("SELECT * FROM order_events WHERE order_id = ? ORDER BY id", [orderId]);
}
export async function listOrdersForUser(userId: number): Promise<(Order & { item_count: number })[]> {
  const database = await db();
  return database.query<Order & { item_count: number }>(
    "SELECT o.*, (SELECT COALESCE(SUM(quantity),0) FROM order_items i WHERE i.order_id = o.id) AS item_count FROM orders o WHERE o.user_id = ? ORDER BY o.id DESC", [userId]);
}
export async function listAllOrders(opts: { status?: string; limit?: number; offset?: number; q?: string } = {}) {
  const database = await db();
  const where: string[] = []; const params: unknown[] = [];
  if (opts.status) { where.push("o.status = ?"); params.push(opts.status); }
  if (opts.q) { where.push("(o.order_number LIKE ? OR o.email LIKE ? OR o.shipping_name LIKE ?)"); const l = `%${opts.q}%`; params.push(l, l, l); }
  const W = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const rows = await database.query<Order & { item_count: number }>(
    `SELECT o.*, (SELECT COALESCE(SUM(quantity),0) FROM order_items i WHERE i.order_id = o.id) AS item_count FROM orders o ${W} ORDER BY o.id DESC LIMIT ? OFFSET ?`,
    [...params, Math.min(opts.limit ?? 100, 500), opts.offset ?? 0]);
  const count = await database.get<{ n: number }>(`SELECT COUNT(*) AS n FROM orders o ${W}`, params);
  return { orders: rows, total: count?.n ?? 0 };
}

export async function addOrderEvent(orderId: number, status: string, note?: string | null) {
  const database = await db();
  await database.run("INSERT INTO order_events (order_id, status, note) VALUES (?, ?, ?)", [orderId, status, note ?? null]);
}

export async function setOrderStatus(orderId: number, status: OrderStatus, note?: string | null): Promise<Order | null> {
  const database = await db();
  await database.run("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?", [status, orderId]);
  await addOrderEvent(orderId, status, note);
  return getOrderById(orderId);
}

export async function setPaymentStatus(orderId: number, payment: PaymentStatus, opts: { verified?: boolean; sessionId?: string | null; note?: string } = {}): Promise<Order | null> {
  const database = await db();
  await database.run(
    `UPDATE orders SET payment_status = ?, payment_verified = CASE WHEN ? THEN 1 ELSE payment_verified END,
            payment_session_id = COALESCE(?, payment_session_id),
            paid_at = CASE WHEN ? = 'paid' AND paid_at IS NULL THEN datetime('now') ELSE paid_at END,
            status = CASE WHEN ? = 'paid' AND status = 'pending' THEN 'confirmed' ELSE status END,
            updated_at = datetime('now')
      WHERE id = ?`,
    [payment, opts.verified ? 1 : 0, opts.sessionId ?? null, payment, payment, orderId]);
  await addOrderEvent(orderId, `payment_${payment}`, opts.note ?? null);
  return getOrderById(orderId);
}

export async function adminStats() {
  const database = await db();
  const [orders, revenue, users, products, lowStock, recent] = await Promise.all([
    database.get<{ n: number }>("SELECT COUNT(*) AS n FROM orders"),
    database.get<{ n: number }>("SELECT COALESCE(SUM(total_cents),0) AS n FROM orders WHERE status <> 'cancelled' AND (payment_status = 'paid' OR payment_method = 'cod')"),
    database.get<{ n: number }>("SELECT COUNT(*) AS n FROM users"),
    database.get<{ n: number }>("SELECT COUNT(*) AS n FROM products WHERE is_active = 1"),
    database.query<{ id: number; name: string; stock: number; slug: string }>("SELECT id, name, stock, slug FROM products WHERE is_active = 1 AND stock <= 10 ORDER BY stock ASC LIMIT 8"),
    database.query<Order & { item_count: number }>("SELECT o.*, (SELECT COALESCE(SUM(quantity),0) FROM order_items i WHERE i.order_id = o.id) AS item_count FROM orders o ORDER BY o.id DESC LIMIT 8"),
  ]);
  const byStatus = await database.query<{ status: string; n: number }>("SELECT status, COUNT(*) AS n FROM orders GROUP BY status");
  return { orders: orders?.n ?? 0, revenueCents: revenue?.n ?? 0, users: users?.n ?? 0, products: products?.n ?? 0, lowStock, recent, byStatus };
}
