"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";

export function ShopFilters({ total }: { total: number }) {
  const sp = useSearchParams(); const router = useRouter();
  const set = (k: string, v: string) => { const u = new URLSearchParams(sp.toString()); if (v) u.set(k, v); else u.delete(k); u.delete("page"); router.push(`/shop?${u}`); };
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-gray-600"><SlidersHorizontal className="h-4 w-4" />{total} result{total === 1 ? "" : "s"}</div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 rounded border-line accent-leaf-700" checked={sp.get("inStock") === "1"} onChange={(e) => set("inStock", e.target.checked ? "1" : "")} />In stock only</label>
        <select value={sp.get("sort") ?? "featured"} onChange={(e) => set("sort", e.target.value)} className="input w-auto py-1.5 text-sm" aria-label="Sort">
          <option value="featured">Featured</option><option value="newest">Newest</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option><option value="name">Name A–Z</option>
        </select>
        {(sp.get("q") || sp.get("category") || sp.get("inStock")) && <button onClick={() => router.push("/shop")} className="btn-ghost btn-sm">Clear</button>}
      </div>
    </div>
  );
}
