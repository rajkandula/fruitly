"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Order } from "@/lib/types";
import { useToast } from "../Toaster";
export function AdminOrderControls({ order }: { order: Order }) {
  const [status, setStatus] = useState(order.status); const [payment, setPayment] = useState(order.payment_status);
  const [note, setNote] = useState(""); const [notify, setNotify] = useState(true); const [busy, setBusy] = useState(false);
  const router = useRouter(); const { toast } = useToast();
  const save = async () => {
    setBusy(true);
    const res = await fetch(`/api/admin/orders/${order.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: status !== order.status ? status : undefined, paymentStatus: payment !== order.payment_status ? payment : undefined, note: note || null, notify }) });
    const d = await res.json(); setBusy(false);
    if (!res.ok) { toast(d.error ?? "Update failed", "error"); return; }
    toast("Order updated"); setNote(""); router.refresh();
  };
  return (
    <div className="card flex flex-wrap items-end gap-3 p-4">
      <div><label className="label">Fulfilment status</label><select className="input w-44" value={status} onChange={(e) => setStatus(e.target.value as Order["status"])}>{["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
      <div><label className="label">Payment status</label><select className="input w-40" value={payment} onChange={(e) => setPayment(e.target.value as Order["payment_status"])}>{["unpaid", "paid", "failed", "refunded"].map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
      <div className="min-w-[16rem] flex-1"><label className="label">Note to customer <span className="text-gray-400">(optional)</span></label><input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tracking number, delivery window…" /></div>
      <label className="flex items-center gap-2 pb-2.5 text-sm"><input type="checkbox" className="h-4 w-4 accent-leaf-700" checked={notify} onChange={(e) => setNotify(e.target.checked)} />Email customer</label>
      <button onClick={save} disabled={busy || (status === order.status && payment === order.payment_status)} className="btn-primary">Update order</button>
    </div>
  );
}
