"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Address } from "@/lib/types";
import { useToast } from "../Toaster";
const EMPTY = { label: "Home", full_name: "", line1: "", line2: "", city: "", state: "", postal_code: "", country: "US", phone: "", is_default: false };
export function AddressBook({ initial }: { initial: Address[] }) {
  const [editing, setEditing] = useState<null | (typeof EMPTY & { id?: number })>(null);
  const [busy, setBusy] = useState(false); const { toast } = useToast(); const router = useRouter();
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editing) return; setBusy(true);
    const { id, ...body } = editing;
    const res = await fetch(id ? `/api/account/addresses/${id}` : "/api/account/addresses", { method: id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, line2: body.line2 || null, phone: body.phone || null }) });
    const d = await res.json(); setBusy(false);
    if (!res.ok) { toast(d.error ?? "Save failed", "error"); return; }
    toast("Address saved"); setEditing(null); router.refresh();
  };
  const remove = async (id: number) => { if (!confirm("Delete this address?")) return; await fetch(`/api/account/addresses/${id}`, { method: "DELETE" }); toast("Address deleted"); router.refresh(); };
  return (
    <div className="mt-3">
      {initial.length === 0 && !editing && <p className="text-sm text-gray-600">No saved addresses yet.</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {initial.map((a) => (
          <div key={a.id} className="rounded-xl border border-line p-4 text-sm">
            <div className="flex items-center justify-between"><b>{a.label}</b>{a.is_default ? <span className="badge bg-leaf-100 text-leaf-800">Default</span> : null}</div>
            <p className="mt-1 text-gray-700">{a.full_name}<br />{a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />{a.city}{a.state ? `, ${a.state}` : ""} {a.postal_code}, {a.country}{a.phone && <><br />{a.phone}</>}</p>
            <div className="mt-3 flex gap-3 text-xs"><button className="link" onClick={() => setEditing({ ...a, line2: a.line2 ?? "", phone: a.phone ?? "", is_default: !!a.is_default })}>Edit</button><button className="text-red-600 hover:underline" onClick={() => remove(a.id)}>Delete</button></div>
          </div>
        ))}
      </div>
      {editing ? (
        <form onSubmit={save} className="mt-4 grid gap-3 rounded-xl border border-leaf-200 bg-leaf-50/40 p-4 sm:grid-cols-2">
          <div><label className="label">Label</label><input className="input" value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })} /></div>
          <div><label className="label">Full name</label><input className="input" required value={editing.full_name} onChange={(e) => setEditing({ ...editing, full_name: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="label">Street</label><input className="input" required value={editing.line1} onChange={(e) => setEditing({ ...editing, line1: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="label">Apt / Suite</label><input className="input" value={editing.line2} onChange={(e) => setEditing({ ...editing, line2: e.target.value })} /></div>
          <div><label className="label">City</label><input className="input" required value={editing.city} onChange={(e) => setEditing({ ...editing, city: e.target.value })} /></div>
          <div><label className="label">State</label><input className="input" value={editing.state} onChange={(e) => setEditing({ ...editing, state: e.target.value })} /></div>
          <div><label className="label">Postal code</label><input className="input" required value={editing.postal_code} onChange={(e) => setEditing({ ...editing, postal_code: e.target.value })} /></div>
          <div><label className="label">Country</label><select className="input" value={editing.country} onChange={(e) => setEditing({ ...editing, country: e.target.value })}>{["US", "CA", "GB", "IN", "AU", "DE", "FR", "SG", "AE"].map((c) => <option key={c}>{c}</option>)}</select></div>
          <div><label className="label">Phone</label><input className="input" value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></div>
          <label className="flex items-center gap-2 self-end text-sm"><input type="checkbox" className="h-4 w-4 accent-leaf-700" checked={editing.is_default} onChange={(e) => setEditing({ ...editing, is_default: e.target.checked })} />Set as default</label>
          <div className="flex gap-2 sm:col-span-2"><button className="btn-primary" disabled={busy}>Save address</button><button type="button" className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button></div>
        </form>
      ) : <button className="btn-secondary mt-4" onClick={() => setEditing({ ...EMPTY })}>+ Add address</button>}
    </div>
  );
}
