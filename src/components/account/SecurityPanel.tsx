"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { useToast } from "../Toaster";
interface S { id: string; user_agent: string; ip: string; created_at: string; last_seen_at: string; expires_at: string; current: boolean }
function describe(ua: string) { const b = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : /Firefox\//.test(ua) ? "Firefox" : "Browser"; const os = /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Mac OS/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : ""; return `${b}${os ? ` on ${os}` : ""}`; }
export function SecurityPanel({ sessions, emailVerified, email }: { sessions: S[]; emailVerified: boolean; email: string }) {
  const [cur, setCur] = useState(""); const [nw, setNw] = useState(""); const [busy, setBusy] = useState(false);
  const { toast } = useToast(); const router = useRouter();
  const change = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const res = await fetch("/api/account/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: cur, newPassword: nw }) });
    const d = await res.json(); setBusy(false);
    if (!res.ok) { toast(d.error ?? "Failed", "error"); return; }
    toast("Password changed. Other devices were signed out."); setCur(""); setNw(""); router.refresh();
  };
  const revoke = async (sid?: string) => { await fetch(`/api/account/sessions?${sid ? `sid=${sid}` : "all=1"}`, { method: "DELETE" }); toast(sid ? "Session revoked" : "Signed out of other devices"); router.refresh(); };
  return (
    <div className="space-y-4">
      <div className="card p-5"><h2 className="text-lg font-bold">Email verification</h2><p className="mt-2 text-sm">{emailVerified ? <span className="text-leaf-800 font-medium">✓ {email} is verified</span> : <>Not verified. <Link href={`/verify-email?email=${encodeURIComponent(email)}`} className="link">Verify now</Link></>}</p></div>
      <div className="card p-5"><h2 className="text-lg font-bold">Change password</h2>
        <form onSubmit={change} className="mt-3 grid gap-3 sm:grid-cols-2">
          <div><label className="label">Current password</label><input type="password" className="input" required value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" /></div>
          <div><label className="label">New password</label><input type="password" className="input" required minLength={8} value={nw} onChange={(e) => setNw(e.target.value)} autoComplete="new-password" /></div>
          <div><button className="btn-primary" disabled={busy}>Update password</button></div>
        </form></div>
      <div className="card p-5"><div className="flex items-center justify-between"><h2 className="text-lg font-bold">Active sessions</h2>{sessions.length > 1 && <button onClick={() => revoke()} className="btn-secondary btn-sm">Sign out other devices</button>}</div>
        <ul className="mt-3 divide-y divide-line text-sm">{sessions.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-3 py-3"><div><p className="font-medium">{describe(s.user_agent)} {s.current && <span className="badge bg-leaf-100 text-leaf-800">This device</span>}</p><p className="text-xs text-gray-500">{s.ip || "unknown IP"} · signed in {formatDate(s.created_at)} · expires {formatDate(s.expires_at, { dateStyle: "medium" })}</p></div>{!s.current && <button onClick={() => revoke(s.id)} className="text-xs text-red-600 hover:underline">Revoke</button>}</li>
        ))}</ul></div>
    </div>
  );
}
