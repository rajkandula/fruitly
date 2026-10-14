import Link from "next/link";
import { listAdminProducts } from "@/lib/repo/products";
import { env } from "@/lib/env";
import { formatMoney } from "@/lib/utils";
import { ProductRowActions } from "@/components/admin/ProductRowActions";

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const products = await listAdminProducts(q);
  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Products <span className="text-sm font-normal text-gray-500">({products.length})</span></h2>
        <div className="flex gap-2"><form className="flex gap-2"><input name="q" defaultValue={q} placeholder="Search…" className="input py-1.5" /><button className="btn-secondary btn-sm">Search</button></form><Link href="/admin/products/new" className="btn-primary btn-sm">+ New product</Link></div>
      </div>
      <div className="mt-4 overflow-x-auto"><table className="table">
        <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>{env.madeToOrder ? "Source / cost" : "Stock"}</th><th>Status</th><th></th></tr></thead>
        <tbody>{products.map((p) => (
          <tr key={p.id}>
            <td><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center overflow-hidden rounded-lg bg-leaf-50">{p.image_url ? <img src={p.image_url} alt="" className="h-full w-full object-cover" /> : null}</span><div><Link href={`/admin/products/${p.id}`} className="font-semibold hover:text-leaf-800">{p.name}</Link><p className="text-xs text-gray-500">/{p.slug}{p.is_featured ? " · featured" : ""}</p></div></div></td>
            <td className="text-gray-700">{p.category_name ?? "—"}</td>
            <td className="tabular-nums">{formatMoney(p.price_cents)}<span className="text-xs text-gray-500">/{p.unit}</span></td>
            <td className="text-xs">{env.madeToOrder
              ? <>{p.source_store ? <span className="font-medium">{p.source_store}</span> : <span className="text-amber-700">set source</span>}{p.cost_cents ? <span className="text-gray-500"> · {formatMoney(p.cost_cents)}</span> : null}</>
              : <span className={`tabular-nums text-sm font-semibold ${p.stock === 0 ? "text-red-600" : p.stock <= 10 ? "text-amber-700" : ""}`}>{p.stock}</span>}</td>
            <td>{!p.is_active ? <span className="badge bg-gray-200 text-gray-700">Hidden</span> : p.availability === "unavailable" ? <span className="badge bg-amber-100 text-amber-800">Unavailable</span> : <span className="badge bg-leaf-100 text-leaf-800">Active</span>}</td>
            <td className="text-right"><ProductRowActions id={p.id} slug={p.slug} /></td>
          </tr>
        ))}</tbody></table></div>
    </div>
  );
}
