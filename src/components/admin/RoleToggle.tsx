"use client";
import { useRouter } from "next/navigation";
import { useToast } from "../Toaster";
export function RoleToggle({ id, role }: { id: number; role: string }) {
  const router = useRouter(); const { toast } = useToast();
  const change = async (r: string) => { const res = await fetch(`/api/admin/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: r }) }); const d = await res.json(); if (!res.ok) { toast(d.error ?? "Failed", "error"); return; } toast("Role updated"); router.refresh(); };
  return <select value={role} onChange={(e) => change(e.target.value)} className="input w-auto py-1 text-xs"><option value="customer">customer</option><option value="admin">admin</option></select>;
}
