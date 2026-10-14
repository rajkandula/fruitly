import Link from "next/link";
import type { Metadata } from "next";
import { listCategories, listProducts } from "@/lib/repo/products";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { ShopFilters } from "@/components/shop/ShopFilters";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Shop" };
type Search = { q?: string; category?: string; sort?: string; page?: string; inStock?: string };
const PAGE = 24;

export default async function ShopPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const sort = (["featured", "price_asc", "price_desc", "newest", "name"].includes(sp.sort ?? "") ? sp.sort : "featured") as "featured";
  const [{ products, total }, categories] = await Promise.all([
    listProducts({ q: sp.q, category: sp.category, sort, inStock: sp.inStock === "1", limit: PAGE, offset: (page - 1) * PAGE }),
    listCategories(),
  ]);
  const active = categories.find((c) => c.slug === sp.category);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const href = (p: number) => { const u = new URLSearchParams(); if (sp.q) u.set("q", sp.q); if (sp.category) u.set("category", sp.category); if (sp.sort) u.set("sort", sp.sort); if (sp.inStock) u.set("inStock", sp.inStock); u.set("page", String(p)); return `/shop?${u}`; };

  return (
    <div className="container-x py-8">
      <div className="mb-6">
        <nav className="text-xs text-gray-500"><Link href="/" className="hover:text-leaf-800">Home</Link> / <Link href="/shop" className="hover:text-leaf-800">Shop</Link>{active && <> / <span className="text-ink">{active.name}</span></>}</nav>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{active ? active.name : sp.q ? `Results for “${sp.q}”` : "All fruit"}</h1>
        <p className="mt-1 text-sm text-gray-600">{active?.description ?? `${total} products, picked fresh.`}</p>
      </div>
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        <Link href="/shop" className={cn("badge whitespace-nowrap border px-3 py-1.5", !sp.category ? "border-leaf-800 bg-leaf-800 text-white" : "border-line bg-white hover:border-leaf-500")}>All</Link>
        {categories.map((c) => (
          <Link key={c.slug} href={`/shop?category=${c.slug}`} className={cn("badge whitespace-nowrap border px-3 py-1.5", sp.category === c.slug ? "border-leaf-800 bg-leaf-800 text-white" : "border-line bg-white hover:border-leaf-500")}>{c.name}</Link>
        ))}
      </div>
      <ShopFilters total={total} />
      {products.length === 0 ? (
        <div className="card mt-6 p-12 text-center"><h2 className="mt-3 text-lg font-semibold">Nothing here yet</h2><p className="text-sm text-gray-600">Try a different search or browse all fruit.</p><Link href="/shop" className="btn-primary mt-5">Browse all</Link></div>
      ) : (
        <ProductGrid products={products} className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4" />
      )}
      {pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {page > 1 && <Link href={href(page - 1)} className="btn-secondary btn-sm">Previous</Link>}
          <span className="text-sm text-gray-600">Page {page} of {pages}</span>
          {page < pages && <Link href={href(page + 1)} className="btn-secondary btn-sm">Next</Link>}
        </div>
      )}
    </div>
  );
}
