import { loadEnv, log } from "./_shared.mts";
loadEnv();
const { db } = await import("../src/lib/db");
const { migrate } = await import("../src/lib/db/migrate");
const { CATEGORIES, PRODUCTS, COUPONS } = await import("../src/lib/seed-data");
const { upsertCategory } = await import("../src/lib/repo/products");
const { upsertCoupon } = await import("../src/lib/repo/coupons");

const database = await db();
await migrate(database);
log.info(`seeding ${database.kind}`);
const catIds = new Map<string, number>();
for (const c of CATEGORIES) { const row = await upsertCategory(c); catIds.set(c.slug, row.id); }
log.ok(`${CATEGORIES.length} categories`);

let created = 0, updated = 0;
for (const p of PRODUCTS) {
  const existing = await database.get<{ id: number }>("SELECT id FROM products WHERE slug = ?", [p.slug]);
  const vals = [p.name, p.description, catIds.get(p.category) ?? null, p.price_cents, p.compare_at_cents ?? null, p.unit, `/images/products/${p.slug}.jpg`, p.emoji, p.badge ?? null, p.origin, JSON.stringify(p.nutrition), p.featured ? 1 : 0];
  if (existing) {
    // Keep live stock levels; refresh catalogue fields.
    await database.run("UPDATE products SET name=?, description=?, category_id=?, price_cents=?, compare_at_cents=?, unit=?, image_url=CASE WHEN image_url LIKE '/images/%' OR image_url='' OR image_url LIKE '/api/media/%' THEN ? ELSE image_url END, emoji=?, badge=?, origin=?, nutrition=?, is_featured=?, updated_at=datetime('now') WHERE id=?", [...vals, existing.id]);
    updated++;
  } else {
    await database.run("INSERT INTO products (name, description, category_id, price_cents, compare_at_cents, unit, image_url, emoji, badge, origin, nutrition, is_featured, slug, stock, is_active) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)", [...vals, p.slug, p.stock]);
    created++;
  }
}
log.ok(`products: ${created} created, ${updated} updated`);
for (const c of COUPONS) await upsertCoupon(c);
log.ok(`${COUPONS.length} coupons (${COUPONS.map((c) => c.code).join(", ")})`);

const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
if (admins.length) {
  const res = await database.run(`UPDATE users SET role='admin' WHERE email IN (${admins.map(() => "?").join(",")}) AND role <> 'admin'`, admins);
  if (res.changes) log.ok(`promoted ${res.changes} admin(s)`);
}
log.ok("seed complete");
