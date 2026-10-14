import { db } from "../db";
import { invalidateCatalog } from "./products";

export interface Review { id: number; product_id: number; user_id: number; user_name: string; rating: number; title: string; body: string; verified_purchase: number; created_at: string }
export interface RatingSummary { avg: number; count: number; dist: Record<1 | 2 | 3 | 4 | 5, number> }

export async function listReviews(productId: number, limit = 50): Promise<Review[]> {
  const database = await db();
  return database.query<Review>(
    `SELECT r.*, u.name AS user_name FROM reviews r JOIN users u ON u.id = r.user_id WHERE r.product_id = ? ORDER BY r.id DESC LIMIT ?`, [productId, limit]);
}
export async function ratingSummary(productId: number): Promise<RatingSummary> {
  const database = await db();
  const rows = await database.query<{ rating: number; n: number }>("SELECT rating, COUNT(*) AS n FROM reviews WHERE product_id = ? GROUP BY rating", [productId]);
  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as RatingSummary["dist"];
  let sum = 0, count = 0;
  for (const r of rows) { dist[r.rating as 1] = r.n; sum += r.rating * r.n; count += r.n; }
  return { avg: count ? Math.round((sum / count) * 10) / 10 : 0, count, dist };
}
/** Ratings for many products at once (product cards). */
export async function ratingsForProducts(ids: number[]): Promise<Map<number, { avg: number; count: number }>> {
  if (!ids.length) return new Map();
  const database = await db();
  const rows = await database.query<{ product_id: number; avg: number; n: number }>(
    `SELECT product_id, AVG(rating) AS avg, COUNT(*) AS n FROM reviews WHERE product_id IN (${ids.map(() => "?").join(",")}) GROUP BY product_id`, ids);
  return new Map(rows.map((r) => [r.product_id, { avg: Math.round(r.avg * 10) / 10, count: r.n }]));
}
export async function userHasPurchased(userId: number, productId: number): Promise<boolean> {
  const database = await db();
  const row = await database.get<{ n: number }>(
    "SELECT COUNT(*) AS n FROM order_items i JOIN orders o ON o.id = i.order_id WHERE o.user_id = ? AND i.product_id = ? AND o.status <> 'cancelled'", [userId, productId]);
  return (row?.n ?? 0) > 0;
}
export async function upsertReview(input: { productId: number; userId: number; rating: number; title: string; body: string; verified: boolean }): Promise<void> {
  const database = await db();
  await database.run(
    `INSERT INTO reviews (product_id, user_id, rating, title, body, verified_purchase) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(product_id, user_id) DO UPDATE SET rating = excluded.rating, title = excluded.title, body = excluded.body, verified_purchase = excluded.verified_purchase, created_at = datetime('now')`,
    [input.productId, input.userId, input.rating, input.title, input.body, input.verified ? 1 : 0]);
  invalidateCatalog();
}
export async function deleteReview(id: number, userId?: number): Promise<void> {
  const database = await db();
  if (userId) await database.run("DELETE FROM reviews WHERE id = ? AND user_id = ?", [id, userId]);
  else await database.run("DELETE FROM reviews WHERE id = ?", [id]);
  invalidateCatalog();
}
