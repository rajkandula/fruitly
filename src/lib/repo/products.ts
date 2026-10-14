import { db } from "../db";
import type { AdminProduct, Category, Product } from "../types";
import { env } from "../env";
import { cached, invalidate } from "../cache";

const TTL = 15_000; // storefront reads are cached briefly; every mutation below invalidates
export function invalidateCatalog() { invalidate("catalog:"); }

/** Public columns — deliberately excludes internal sourcing data (cost_cents, source_store). */
const P_COLS = `p.id, p.slug, p.name, p.description, p.category_id, c.name AS category_name, c.slug AS category_slug,
  p.price_cents, p.compare_at_cents, p.unit, p.stock, p.image_url, p.emoji, p.badge, p.origin, p.nutrition,
  p.is_featured, p.is_active, p.availability, p.created_at, p.updated_at`;
/** Admin columns — adds what we pay and where we buy it. Never use for public endpoints. */
const A_COLS = `${P_COLS}, p.cost_cents, p.source_store`;
const FROM = "FROM products p LEFT JOIN categories c ON c.id = p.category_id";

export interface ProductQuery {
  q?: string; category?: string; sort?: "featured" | "price_asc" | "price_desc" | "newest" | "name";
  featured?: boolean; includeInactive?: boolean; limit?: number; offset?: number; minPrice?: number; maxPrice?: number; inStock?: boolean;
}

export async function listProducts(opts: ProductQuery = {}): Promise<{ products: Product[]; total: number }> {
  return cached(`catalog:list:${JSON.stringify(opts)}`, TTL, () => listProductsUncached(opts));
}
async function listProductsUncached(opts: ProductQuery): Promise<{ products: Product[]; total: number }> {
  const database = await db();
  const where: string[] = [];
  const params: unknown[] = [];
  if (!opts.includeInactive) { where.push("p.is_active = 1"); where.push("p.availability <> 'unavailable'"); }
  if (opts.q) { where.push("(p.name LIKE ? OR p.description LIKE ? OR p.origin LIKE ?)"); const like = `%${opts.q}%`; params.push(like, like, like); }
  if (opts.category) { where.push("c.slug = ?"); params.push(opts.category); }
  if (opts.featured) where.push("p.is_featured = 1");
  if (opts.inStock && !env.madeToOrder) where.push("p.stock > 0");
  if (opts.minPrice !== undefined) { where.push("p.price_cents >= ?"); params.push(opts.minPrice); }
  if (opts.maxPrice !== undefined) { where.push("p.price_cents <= ?"); params.push(opts.maxPrice); }
  const W = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const order = {
    featured: env.madeToOrder ? "p.is_featured DESC, p.name ASC" : "p.is_featured DESC, p.stock > 0 DESC, p.name ASC",
    price_asc: "p.price_cents ASC, p.name ASC",
    price_desc: "p.price_cents DESC, p.name ASC",
    newest: "p.created_at DESC, p.id DESC",
    name: "p.name ASC",
  }[opts.sort ?? "featured"];
  const limit = Math.min(Math.max(opts.limit ?? 48, 1), 200);
  const offset = Math.max(opts.offset ?? 0, 0);
  const [products, count] = await Promise.all([
    database.query<Product>(`SELECT ${P_COLS} ${FROM} ${W} ORDER BY ${order} LIMIT ? OFFSET ?`, [...params, limit, offset]),
    database.get<{ n: number }>(`SELECT COUNT(*) AS n ${FROM} ${W}`, params),
  ]);
  return { products, total: count?.n ?? 0 };
}

export async function getProductBySlug(slug: string, includeInactive = false): Promise<Product | null> {
  return cached(`catalog:slug:${slug}:${includeInactive ? 1 : 0}`, TTL, async () => {
    const database = await db();
    return database.get<Product>(`SELECT ${P_COLS} ${FROM} WHERE p.slug = ? ${includeInactive ? "" : "AND p.is_active = 1"}`, [slug]);
  });
}
export async function getProductById(id: number): Promise<Product | null> {
  const database = await db();
  return database.get<Product>(`SELECT ${P_COLS} ${FROM} WHERE p.id = ?`, [id]);
}
/** Admin-only: includes cost and source store. */
export async function getAdminProductById(id: number): Promise<AdminProduct | null> {
  const database = await db();
  return database.get<AdminProduct>(`SELECT ${A_COLS} ${FROM} WHERE p.id = ?`, [id]);
}
export async function listAdminProducts(q?: string): Promise<AdminProduct[]> {
  const database = await db();
  const where = q ? "WHERE p.name LIKE ? OR p.slug LIKE ?" : "";
  const params = q ? [`%${q}%`, `%${q}%`] : [];
  return database.query<AdminProduct>(`SELECT ${A_COLS} ${FROM} ${where} ORDER BY p.name ASC`, params);
}
export async function getProductsByIds(ids: number[]): Promise<Product[]> {
  if (!ids.length) return [];
  const database = await db();
  return database.query<Product>(`SELECT ${P_COLS} ${FROM} WHERE p.id IN (${ids.map(() => "?").join(",")})`, ids);
}
export async function relatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const database = await db();
  return database.query<Product>(
    `SELECT ${P_COLS} ${FROM} WHERE p.is_active = 1 AND p.id <> ? ORDER BY (p.category_id = ?) DESC, p.is_featured DESC, RANDOM() LIMIT ?`,
    [product.id, product.category_id ?? -1, limit]);
}

export interface ProductInput {
  slug: string; name: string; description: string; category_id: number | null; price_cents: number; compare_at_cents: number | null;
  unit: string; stock: number; image_url: string; emoji: string; badge: string | null; origin: string | null; nutrition: string | null;
  is_featured: number; is_active: number;
  cost_cents?: number | null; source_store?: string | null; availability?: string;
}
export async function createProduct(input: ProductInput): Promise<Product> {
  const database = await db();
  const res = await database.run(
    `INSERT INTO products (slug, name, description, category_id, price_cents, compare_at_cents, unit, stock, image_url, emoji, badge, origin, nutrition, is_featured, is_active, cost_cents, source_store, availability)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [input.slug, input.name, input.description, input.category_id, input.price_cents, input.compare_at_cents, input.unit, input.stock, input.image_url, input.emoji, input.badge, input.origin, input.nutrition, input.is_featured, input.is_active, input.cost_cents ?? null, input.source_store ?? null, input.availability ?? "available"]);
  invalidateCatalog();
  return (await getProductById(res.lastRowId))!;
}
export async function updateProduct(id: number, input: Partial<ProductInput>): Promise<Product | null> {
  const database = await db();
  const keys = Object.keys(input) as (keyof ProductInput)[];
  if (keys.length) {
    await database.run(
      `UPDATE products SET ${keys.map((k) => `${k} = ?`).join(", ")}, updated_at = datetime('now') WHERE id = ?`,
      [...keys.map((k) => input[k] ?? null), id]);
  }
  invalidateCatalog();
  return getProductById(id);
}
export async function deleteProduct(id: number) {
  const database = await db();
  await database.run("DELETE FROM products WHERE id = ?", [id]);
  invalidateCatalog();
}
export async function adjustStock(id: number, delta: number): Promise<boolean> {
  const database = await db();
  // Guard against negative stock atomically.
  const res = await database.run("UPDATE products SET stock = stock + ?, updated_at = datetime('now') WHERE id = ? AND stock + ? >= 0", [delta, id, delta]);
  invalidateCatalog();
  return res.changes > 0;
}

export async function listCategories(): Promise<(Category & { product_count: number })[]> {
  return cached("catalog:categories", TTL, async () => {
  const database = await db();
  return database.query<Category & { product_count: number }>(
    `SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_active = 1) AS product_count
       FROM categories c ORDER BY c.sort_order ASC, c.name ASC`);
  });
}
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const database = await db();
  return database.get<Category>("SELECT * FROM categories WHERE slug = ?", [slug]);
}
export async function upsertCategory(c: Omit<Category, "id">): Promise<Category> {
  const database = await db();
  await database.run(
    `INSERT INTO categories (slug, name, description, emoji, sort_order) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(slug) DO UPDATE SET name = excluded.name, description = excluded.description, emoji = excluded.emoji, sort_order = excluded.sort_order`,
    [c.slug, c.name, c.description, c.emoji, c.sort_order]);
  invalidateCatalog();
  return (await getCategoryBySlug(c.slug))!;
}
