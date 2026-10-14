"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@/lib/types";
import { useToast } from "../Toaster";
export function CategoriesManager({ categories }: { categories: (Category & { product_count: number })[] }) {
  const router = useRouter(); const { toast } = useToast();
  const [f, setF] = useState({ name: "", slug: "", emoji: "", description: "", sort_order: String(categories.length + 1) });
  const [busy, setBusy] = useState(false);
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const res = await fetch("/api/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: f.name, slug: f.slug || undefined, emoji: f.emoji, description: f.description, sort_order: Number(f.sort_order) }) });
    const d = await res.json(); setBusy(false);
    if (!res.ok) { toast(d.error ?? "Failed", "error"); return; }
    toast("Category saved"); setF({ name: "", slug: "", emoji: "", description: "", sort_order: String(categories.length + 2) }); router.refresh();
  };
  return (
    <div className="mt-3">
      <form onSubmit={save} className="grid gap-3 rounded-xl border border-line bg-leaf-50/40 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div><label className="label">Name</label><input className="input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div><label className="label">Slug <span className="text-gray-400">(to edit, reuse slug)</span></label><input className="input font-mono" value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} placeholder="auto" /></div>
        <div><label className="label">Emoji</label><input className="input" maxLength={8} value={f.emoji} onChange={(e) => setF({ ...f, emoji: e.target.value })} /></div>
        <div><label className="label">Sort</label><input type="number" className="input" value={f.sort_order} onChange={(e) => setF({ ...f, sort_order: e.target.value })} /></div>
        <div><label className="label">Description</label><input className="input" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
        <div className="sm:col-span-2 lg:col-span-5"><button className="btn-primary" disabled={busy}>Save category</button></div>
      </form>
      <ul className="mt-4 divide-y divide-line text-sm">{categories.map((c) => <li key={c.id} className="flex items-center justify-between py-2"><span>{c.emoji} <b>{c.name}</b> <span className="font-mono text-xs text-gray-500">/{c.slug}</span> · {c.product_count} products</span><button className="link text-xs" onClick={() => setF({ name: c.name, slug: c.slug, emoji: c.emoji, description: c.description, sort_order: String(c.sort_order) })}>Edit</button></li>)}</ul>
    </div>
  );
}
