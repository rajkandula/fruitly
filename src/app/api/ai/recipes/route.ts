import { z } from "zod";
import { handler, json, fail, parseBody } from "@/lib/api";
import { recipeIdeas, aiEnabled } from "@/lib/ai";
import { getProductBySlug } from "@/lib/repo/products";
export const POST = handler(async (req) => {
  if (!aiEnabled()) return fail(503, "AI assistant is not available.");
  const { slug } = await parseBody(req, z.object({ slug: z.string().trim().min(1).max(80) }));
  const product = await getProductBySlug(slug);
  if (!product) return fail(404, "Product not found");
  const r = await recipeIdeas(product.name, product.origin);
  return json({ ok: true, ...r });
});
