/** Assigns an internal source store + cost estimate to each product (made-to-order mode). */
import { loadEnv, log } from "./_shared.mts";
loadEnv();
const { db } = await import("../src/lib/db");

const STORE: Record<string, string> = {
  "alphonso-mango": "Indian grocer (Oak Tree Rd)", "dragon-fruit": "Whole Foods", "golden-kiwi": "Whole Foods",
  "hass-avocados": "Whole Foods", "heirloom-tomatoes": "Whole Foods", "pomegranate": "Whole Foods",
  "meyer-lemons": "Whole Foods", "raspberries": "Whole Foods", "bing-cherries": "Whole Foods", "apricots": "Whole Foods",
  "papaya-formosa": "ShopRite", "young-coconut": "ShopRite", "gold-pineapple": "ShopRite", "red-seedless-grapes": "ShopRite",
  "yellow-peaches": "ShopRite", "black-plums": "ShopRite", "honeycrisp-apples": "ShopRite", "seedless-watermelon": "ShopRite",
  "cantaloupe": "ShopRite", "honeydew-melon": "ShopRite",
  "cavendish-bananas": "ACME", "navel-oranges": "ACME", "clementines": "ACME", "pink-grapefruit": "ACME",
  "strawberries": "ACME", "blueberries": "ACME", "granny-smith-apples": "ACME", "bartlett-pears": "ACME",
  "seasonal-fruit-basket": "Mixed (multi-store)", "tropical-box": "Mixed (multi-store)",
  "berry-lovers-box": "Mixed (multi-store)", "office-fruit-box": "Mixed (multi-store)",
};
/** Assume you buy at ~58% of your list price — edit per product in the admin once you know real costs. */
const COST_RATIO = Number(process.env.COST_RATIO ?? 0.58);

const d = await db();
const rows = await d.query<{ id: number; slug: string; price_cents: number }>("SELECT id, slug, price_cents FROM products");
let n = 0;
for (const r of rows) {
  const store = STORE[r.slug] ?? "ShopRite";
  const cost = Math.round((r.price_cents * COST_RATIO) / 5) * 5;
  await d.run("UPDATE products SET source_store = ?, cost_cents = ?, updated_at = datetime('now') WHERE id = ?", [store, cost, r.id]);
  n++;
}
log.ok(`sourcing set for ${n} products (cost ≈ ${Math.round(COST_RATIO * 100)}% of price)`);
