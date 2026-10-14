import { handler, json, fail, parseBody, requireAdmin } from "@/lib/api";
import { productInputSchema } from "@/lib/validation";
import { createProduct, getProductBySlug, listAdminProducts } from "@/lib/repo/products";
import { slugify } from "@/lib/utils";

export const GET = handler(async (req) => {
  await requireAdmin();
  const url = new URL(req.url);
  const products = await listAdminProducts(url.searchParams.get("q") ?? undefined);
  return json({ products, total: products.length });
});
export const POST = handler(async (req) => {
  await requireAdmin();
  const body = await parseBody(req, productInputSchema);
  const slug = body.slug || slugify(body.name);
  if (await getProductBySlug(slug, true)) return fail(409, "A product with this slug already exists.");
  const product = await createProduct({
    slug, name: body.name, description: body.description, category_id: body.category_id ?? null, price_cents: body.price_cents,
    compare_at_cents: body.compare_at_cents ?? null, unit: body.unit, stock: body.stock, image_url: body.image_url, emoji: body.emoji,
    badge: body.badge ?? null, origin: body.origin ?? null, nutrition: body.nutrition ?? null, is_featured: body.is_featured ? 1 : 0, is_active: body.is_active ? 1 : 0,
    cost_cents: body.cost_cents ?? null, source_store: body.source_store ?? null, availability: body.availability ?? "available",
  });
  return json({ product }, { status: 201 });
});
