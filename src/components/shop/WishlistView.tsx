"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useWishlist } from "./WishlistProvider";
import { AddToCartButton } from "../cart/AddToCartButton";
import { Price } from "../Price";
import { WishlistButton } from "./WishlistButton";
import type { Product } from "@/lib/types";
export function WishlistView() {
  const { ids, hydrated } = useWishlist(); const [products, setProducts] = useState<Product[] | null>(null);
  useEffect(() => {
    if (!hydrated) return;
    if (ids.length === 0) { setProducts([]); return; }
    fetch(`/api/products?ids=${ids.join(",")}&limit=200`).then((r) => r.json()).then((d) => setProducts(d.products ?? [])).catch(() => setProducts([]));
  }, [ids, hydrated]);
  if (!hydrated || products === null) return <div className="mt-6 h-40 animate-pulse rounded-2xl bg-white" />;
  if (products.length === 0) return <div className="card mt-6 p-12 text-center"><h2 className="text-xl font-semibold">Nothing saved yet</h2><p className="mt-1 text-sm text-gray-600">Tap the heart on any fruit to keep it here.</p><Link href="/shop" className="btn-primary mt-6">Browse fruit</Link></div>;
  return (
    <div className="card mt-6 divide-y divide-line">
      {products.map((p) => (
        <div key={p.id} className="flex items-center gap-4 p-4">
          <Link href={`/shop/${p.slug}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-leaf-50">{p.image_url ? <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" /> : <div className="h-full w-full bg-leaf-50" />}</Link>
          <div className="min-w-0 flex-1"><Link href={`/shop/${p.slug}`} className="font-semibold hover:text-leaf-800">{p.name}</Link><p className="text-xs text-gray-500">{p.category_name}</p><Price cents={p.price_cents} compareAt={p.compare_at_cents} unit={p.unit} size="sm" className="mt-1" /></div>
          <div className="flex items-center gap-2"><AddToCartButton product={p} size="sm" /><WishlistButton product={p} /></div>
        </div>
      ))}
    </div>
  );
}
