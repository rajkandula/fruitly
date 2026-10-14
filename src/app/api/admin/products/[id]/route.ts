import { handler, json, fail, parseBody, requireAdmin } from "@/lib/api";
import { productInputSchema } from "@/lib/validation";
import { deleteProduct, getAdminProductById, getProductById, getProductBySlug, updateProduct } from "@/lib/repo/products";

type Ctx = { params: Promise<{ id: string }> };
export const GET = handler<Ctx>(async (_req, { params }) => {
  await requireAdmin();
  const product = await getAdminProductById(Number((await params).id));
  return product ? json({ product }) : fail(404, "Product not found");
});
export const PUT = handler<Ctx>(async (req, { params }) => {
  await requireAdmin();
  const id = Number((await params).id);
  const existing = await getProductById(id);
  if (!existing) return fail(404, "Product not found");
  const body = await parseBody(req, productInputSchema.partial());
  if (body.slug && body.slug !== existing.slug && (await getProductBySlug(body.slug, true))) return fail(409, "Slug already in use.");
  const product = await updateProduct(id, {
    ...(body.slug !== undefined && { slug: body.slug }), ...(body.name !== undefined && { name: body.name }),
    ...(body.description !== undefined && { description: body.description }), ...(body.category_id !== undefined && { category_id: body.category_id }),
    ...(body.price_cents !== undefined && { price_cents: body.price_cents }), ...(body.compare_at_cents !== undefined && { compare_at_cents: body.compare_at_cents }),
    ...(body.unit !== undefined && { unit: body.unit }), ...(body.stock !== undefined && { stock: body.stock }),
    ...(body.image_url !== undefined && { image_url: body.image_url }), ...(body.emoji !== undefined && { emoji: body.emoji }),
    ...(body.badge !== undefined && { badge: body.badge }), ...(body.origin !== undefined && { origin: body.origin }),
    ...(body.nutrition !== undefined && { nutrition: body.nutrition }),
    ...(body.is_featured !== undefined && { is_featured: body.is_featured ? 1 : 0 }), ...(body.is_active !== undefined && { is_active: body.is_active ? 1 : 0 }),
    ...(body.cost_cents !== undefined && { cost_cents: body.cost_cents }), ...(body.source_store !== undefined && { source_store: body.source_store }),
    ...(body.availability !== undefined && { availability: body.availability }),
  });
  return json({ product });
});
export const DELETE = handler<Ctx>(async (_req, { params }) => {
  await requireAdmin();
  await deleteProduct(Number((await params).id));
  return json({ ok: true });
});
