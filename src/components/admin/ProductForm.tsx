"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";
import type { AdminProduct, Category } from "@/lib/types";
import { useToast } from "../Toaster";

export function ProductForm({ categories, product, storage, madeToOrder, stores }: { categories: Category[]; product?: AdminProduct; storage: boolean; madeToOrder: boolean; stores: string[] }) {
  const router = useRouter(); const { toast } = useToast();
  const [f, setF] = useState({
    name: product?.name ?? "", slug: product?.slug ?? "", description: product?.description ?? "", category_id: (product?.category_id ?? categories[0]?.id ?? null) as number | null,
    price: product ? (product.price_cents / 100).toFixed(2) : "", compare_at: product?.compare_at_cents ? (product.compare_at_cents / 100).toFixed(2) : "",
    unit: product?.unit ?? "each", stock: String(product?.stock ?? 0), image_url: product?.image_url ?? "", emoji: product?.emoji ?? "", badge: product?.badge ?? "", origin: product?.origin ?? "",
    nutrition: product?.nutrition ?? "", is_featured: !!product?.is_featured, is_active: product ? !!product.is_active : true,
    cost: product?.cost_cents ? (product.cost_cents / 100).toFixed(2) : "", source_store: product?.source_store ?? "", availability: (product?.availability ?? "available") as "available" | "limited" | "seasonal" | "unavailable",
  });
  const [busy, setBusy] = useState(false); const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const pre = await fetch("/api/admin/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contentType: file.type, fileName: file.name }) });
      const d = await pre.json(); if (!pre.ok) throw new Error(d.error ?? "Presign failed");
      const put = await fetch(d.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!put.ok) throw new Error(`Upload failed (${put.status})`);
      setF((x) => ({ ...x, image_url: d.publicUrl })); toast("Image uploaded to storage");
    } catch (e) { toast(e instanceof Error ? e.message : "Upload failed", "error"); } finally { setUploading(false); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const body = {
      name: f.name, slug: f.slug || undefined, description: f.description, category_id: f.category_id ? Number(f.category_id) : null,
      price_cents: Math.round(Number(f.price) * 100), compare_at_cents: f.compare_at ? Math.round(Number(f.compare_at) * 100) : null,
      unit: f.unit, stock: Number(f.stock), image_url: f.image_url, emoji: f.emoji, badge: f.badge || null, origin: f.origin || null, nutrition: f.nutrition || null,
      is_featured: f.is_featured, is_active: f.is_active,
      cost_cents: f.cost ? Math.round(Number(f.cost) * 100) : null, source_store: f.source_store || null, availability: f.availability,
    };
    const res = await fetch(product ? `/api/admin/products/${product.id}` : "/api/admin/products", { method: product ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await res.json(); setBusy(false);
    if (!res.ok) { toast(d.error ?? "Save failed", "error"); return; }
    toast(product ? "Product updated" : "Product created"); router.push("/admin/products"); router.refresh();
  };

  return (
    <form onSubmit={submit} className="mt-4 grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="label">Name</label><input className="input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div><label className="label">Slug <span className="text-gray-400">(auto if blank)</span></label><input className="input font-mono" value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} placeholder="alphonso-mango" /></div>
          <div><label className="label">Category</label><select className="input" value={f.category_id === null ? "" : String(f.category_id)} onChange={(e) => setF({ ...f, category_id: e.target.value ? Number(e.target.value) : null })}><option value="">—</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}</select></div>
          <div><label className="label">Origin</label><input className="input" value={f.origin} onChange={(e) => setF({ ...f, origin: e.target.value })} placeholder="Valencia, Spain" /></div>
          <div><label className="label">Price ($)</label><input type="number" step="0.01" min="0" className="input" required value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></div>
          <div><label className="label">Compare-at price ($)</label><input type="number" step="0.01" min="0" className="input" value={f.compare_at} onChange={(e) => setF({ ...f, compare_at: e.target.value })} /></div>
          <div><label className="label">Unit</label><select className="input" value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })}>{["each", "kg", "lb", "pack", "box", "bunch", "basket"].map((u) => <option key={u}>{u}</option>)}</select></div>
          {madeToOrder
            ? <div><label className="label">Availability</label><select className="input" value={f.availability} onChange={(e) => setF({ ...f, availability: e.target.value as typeof f.availability })}><option value="available">Available</option><option value="limited">Limited</option><option value="seasonal">In season</option><option value="unavailable">Unavailable</option></select></div>
            : <div><label className="label">Stock</label><input type="number" min="0" className="input" required value={f.stock} onChange={(e) => setF({ ...f, stock: e.target.value })} /></div>}
          <div><label className="label">Badge</label><input className="input" value={f.badge} onChange={(e) => setF({ ...f, badge: e.target.value })} placeholder="Seasonal, New, Best seller…" /></div>
          <div><label className="label">Emoji</label><input className="input" value={f.emoji} onChange={(e) => setF({ ...f, emoji: e.target.value })} maxLength={8} /></div>
        </div>
        <div className="rounded-xl border border-dashed border-line bg-gray-50/60 p-4">
          <h3 className="text-sm font-bold">Sourcing <span className="font-normal text-gray-500">— internal only, never shown to customers</span></h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div><label className="label">Where you buy it</label>
              <input className="input" list="store-list" value={f.source_store} onChange={(e) => setF({ ...f, source_store: e.target.value })} placeholder="Whole Foods, ACME, ShopRite…" />
              <datalist id="store-list">{stores.map((st) => <option key={st} value={st} />)}</datalist>
            </div>
            <div><label className="label">Your cost ($)</label><input type="number" step="0.01" min="0" className="input" value={f.cost} onChange={(e) => setF({ ...f, cost: e.target.value })} placeholder="What you pay" /></div>
            <div><label className="label">Margin</label>
              <p className="input flex items-center bg-white text-sm">{f.cost && f.price ? (() => { const c = Number(f.cost), pr = Number(f.price); const m = pr - c; const pct = pr > 0 ? Math.round((m / pr) * 100) : 0; return <span className={m > 0 ? "text-leaf-700 font-semibold" : "text-red-600 font-semibold"}>${m.toFixed(2)} ({pct}%)</span>; })() : <span className="text-gray-400">set cost + price</span>}</p>
            </div>
          </div>
        </div>
        <div><label className="label">Description</label><textarea className="input" rows={5} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
        <div><label className="label">Nutrition (JSON) <span className="text-gray-400">optional</span></label><textarea className="input font-mono text-xs" rows={3} value={f.nutrition} onChange={(e) => setF({ ...f, nutrition: e.target.value })} placeholder='{"serving":"1 apple","calories":"95"}' /></div>
        <div className="flex flex-wrap gap-5 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-leaf-700" checked={f.is_featured} onChange={(e) => setF({ ...f, is_featured: e.target.checked })} />Featured on home page</label>
          <label className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-leaf-700" checked={f.is_active} onChange={(e) => setF({ ...f, is_active: e.target.checked })} />Visible in store</label>
        </div>
        <div className="flex gap-2"><button className="btn-primary" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{product ? "Save changes" : "Create product"}</button><button type="button" className="btn-ghost" onClick={() => router.back()}>Cancel</button></div>
      </div>
      <div className="space-y-3">
        <label className="label">Image</label>
        <div className="aspect-square overflow-hidden rounded-2xl border border-line bg-leaf-50">{f.image_url ? <img src={f.image_url} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-sm text-gray-400">No image</div>}</div>
        <input className="input text-xs" value={f.image_url} onChange={(e) => setF({ ...f, image_url: e.target.value })} placeholder="/images/products/… or https://…" />
        {storage ? (<>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) void upload(file); e.target.value = ""; }} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-secondary w-full">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}Upload to Harakumo Storage</button>
          <p className="text-xs text-gray-500">Uploads go straight to Harakumo Storage via a presigned URL and are served through <code>/api/media/…</code>.</p>
        </>) : <p className="text-xs text-amber-700">Storage not configured — paste an image URL instead.</p>}
      </div>
    </form>
  );
}
