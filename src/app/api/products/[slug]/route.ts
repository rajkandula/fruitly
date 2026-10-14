import { handler, json, fail } from "@/lib/api";
import { getProductBySlug, relatedProducts } from "@/lib/repo/products";

export const GET = handler<{ params: Promise<{ slug: string }> }>(async (_req, { params }) => {
  const product = await getProductBySlug((await params).slug);
  if (!product) return fail(404, "Product not found");
  return json({ product, related: await relatedProducts(product) });
});
