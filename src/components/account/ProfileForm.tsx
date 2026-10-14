"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../Toaster";
export function ProfileForm({ user }: { user: { name: string; email: string; phone: string | null } }) {
  const [name, setName] = useState(user.name); const [phone, setPhone] = useState(user.phone ?? ""); const [busy, setBusy] = useState(false);
  const { toast } = useToast(); const router = useRouter();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const res = await fetch("/api/account/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, phone: phone || null }) });
    const d = await res.json(); setBusy(false);
    if (!res.ok) { toast(d.error ?? "Update failed", "error"); return; }
    toast("Profile updated"); router.refresh();
  };
  return (
    <form onSubmit={submit} className="mt-3 grid gap-3 sm:grid-cols-2">
      <div><label className="label">Name</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} /></div>
      <div><label className="label">Phone</label><input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" /></div>
      <div className="sm:col-span-2"><label className="label">Email</label><input className="input" value={user.email} disabled /><p className="mt-1 text-xs text-gray-500">Email changes aren&apos;t supported yet — contact support.</p></div>
      <div><button className="btn-primary" disabled={busy}>Save changes</button></div>
    </form>
  );
}
