"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Coupon } from "@/lib/repo/coupons";
import { formatMoney, formatDate } from "@/lib/utils";
import { useToast } from "../Toaster";
export function CouponsManager({ coupons }: { coupons: Coupon[] }) {
  const router = useRouter(); const { toast } = useToast();
  const [f, setF] = useState({ code: "", type: "percent" as "percent" | "fixed", value: "10", min: "0", max_uses: "", expires: "" });
  const [busy, setBusy] = useState(false);
  const create = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const body = { code: f.code, type: f.type, value: f.type === "percent" ? Number(f.value) : Math.round(Number(f.value) * 100), min_subtotal_cents: Math.round(Number(f.min || 0) * 100), max_uses: f.max_uses ? Number(f.max_uses) : null, expires_at: f.expires ? new Date(f.expires).toISOString() : null };
    const res = await fetch("/api/admin/coupons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await res.json(); setBusy(false);
    if (!res.ok) { toast(d.error ?? "Failed", "error"); return; }
    toast("Coupon saved"); setF({ ...f, code: "" }); router.refresh();
  };
  const toggle = async (c: Coupon) => { await fetch(`/api/admin/coupons/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_active: !c.is_active }) }); router.refresh(); };
  const del = async (c: Coupon) => { if (!confirm(`Delete ${c.code}?`)) return; await fetch(`/api/admin/coupons/${c.id}`, { method: "DELETE" }); toast("Deleted"); router.refresh(); };
  return (
    <div className="mt-3">
      <form onSubmit={create} className="grid gap-3 rounded-xl border border-line bg-leaf-50/40 p-4 sm:grid-cols-3 lg:grid-cols-6">
        <div><label className="label">Code</label><input className="input uppercase" required value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} placeholder="SUMMER15" /></div>
        <div><label className="label">Type</label><select className="input" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as "percent" })}><option value="percent">% off</option><option value="fixed">$ off</option></select></div>
        <div><label className="label">{f.type === "percent" ? "Percent" : "Amount ($)"}</label><input type="number" step={f.type === "percent" ? 1 : 0.01} min={0} className="input" required value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} /></div>
        <div><label className="label">Min order ($)</label><input type="number" step="0.01" min={0} className="input" value={f.min} onChange={(e) => setF({ ...f, min: e.target.value })} /></div>
        <div><label className="label">Max uses</label><input type="number" min={1} className="input" value={f.max_uses} onChange={(e) => setF({ ...f, max_uses: e.target.value })} placeholder="∞" /></div>
        <div><label className="label">Expires</label><input type="date" className="input" value={f.expires} onChange={(e) => setF({ ...f, expires: e.target.value })} /></div>
        <div className="sm:col-span-3 lg:col-span-6"><button className="btn-primary" disabled={busy}>Save coupon</button></div>
      </form>
      <div className="mt-4 overflow-x-auto"><table className="table"><thead><tr><th>Code</th><th>Discount</th><th>Min order</th><th>Uses</th><th>Expires</th><th>Status</th><th></th></tr></thead>
        <tbody>{coupons.map((c) => <tr key={c.id}><td className="font-mono font-semibold">{c.code}</td><td>{c.type === "percent" ? `${c.value}%` : formatMoney(c.value)}</td><td>{c.min_subtotal_cents ? formatMoney(c.min_subtotal_cents) : "—"}</td><td>{c.uses}{c.max_uses ? ` / ${c.max_uses}` : ""}</td><td className="text-xs text-gray-500">{c.expires_at ? formatDate(c.expires_at, { dateStyle: "medium" }) : "Never"}</td><td>{c.is_active ? <span className="badge bg-leaf-100 text-leaf-800">Active</span> : <span className="badge bg-gray-200 text-gray-700">Off</span>}</td><td className="text-right text-xs"><button className="link mr-3" onClick={() => toggle(c)}>{c.is_active ? "Disable" : "Enable"}</button><button className="text-red-600 hover:underline" onClick={() => del(c)}>Delete</button></td></tr>)}
        {coupons.length === 0 && <tr><td colSpan={7} className="text-center text-gray-500">No coupons</td></tr>}</tbody></table></div>
    </div>
  );
}
