import { z } from "zod";
import { handler, json, parseBody, requireAdmin } from "@/lib/api";
import { listCategories, upsertCategory } from "@/lib/repo/products";
import { slugify } from "@/lib/utils";
export const GET = handler(async () => { await requireAdmin(); return json({ categories: await listCategories() }); });
export const POST = handler(async (req) => {
  await requireAdmin();
  const b = await parseBody(req, z.object({ name: z.string().trim().min(2).max(60), slug: z.string().trim().max(60).optional(), description: z.string().trim().max(300).optional().default(""), emoji: z.string().trim().max(8).optional().default(""), sort_order: z.number().int().optional().default(0) }));
  return json({ category: await upsertCategory({ slug: b.slug || slugify(b.name), name: b.name, description: b.description, emoji: b.emoji, sort_order: b.sort_order }) }, { status: 201 });
});
