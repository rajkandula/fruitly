import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { listCategories, listProducts } from "@/lib/repo/products";

// Generated per-request so the catalogue is included even when the build machine has no database access.
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.appUrl;
  const core: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/shop`, changeFrequency: "daily", priority: 0.9 },
  ];
  // The sitemap is generated at build time too, where the database may not be reachable yet.
  let products: Awaited<ReturnType<typeof listProducts>>["products"] = [];
  let categories: Awaited<ReturnType<typeof listCategories>> = [];
  try {
    [{ products }, categories] = await Promise.all([listProducts({ limit: 200 }), listCategories()]);
  } catch (err) {
    console.warn("[sitemap] catalogue unavailable, emitting core routes only:", err instanceof Error ? err.message : err);
    return core;
  }
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/shop`, changeFrequency: "daily", priority: 0.9 },
    ...categories.map((c) => ({ url: `${base}/shop?category=${c.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...products.map((p) => ({ url: `${base}/shop/${p.slug}`, lastModified: new Date(p.updated_at.replace(" ", "T") + "Z"), changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
