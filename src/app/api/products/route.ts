import { z } from "zod";
import { handler, json, parseQuery } from "@/lib/api";
import { getProductsByIds, listProducts } from "@/lib/repo/products";

const q = z.object({
  q: z.string().trim().max(80).optional(),
  category: z.string().trim().max(80).optional(),
  sort: z.enum(["featured", "price_asc", "price_desc", "newest", "name"]).optional(),
  featured: z.coerce.boolean().optional(),
  inStock: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  ids: z.string().regex(/^\d+(,\d+)*$/).optional(),
});

export const GET = handler(async (req) => {
  const params = parseQuery(req.url, q);
  if (params.ids) {
    const ids = params.ids.split(",").map(Number).slice(0, 200);
    const products = (await getProductsByIds(ids)).filter((p) => p.is_active);
    return json({ products, total: products.length });
  }
  const result = await listProducts(params);
  return json(result);
});
