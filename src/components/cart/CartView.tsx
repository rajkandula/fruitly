"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Minus, Plus, Trash2, ArrowRight, Tag } from "lucide-react";
import { useCart } from "./CartProvider";
import { formatMoney } from "@/lib/utils";

interface Totals { subtotal: number; shipping: number; tax: number; discount: number; total: number; couponCode: string | null; couponError?: string }
interface PricedLine { productId: number; available: boolean; stock: number; quantity: number; priceCents: number; lineTotal: number }

export function CartView() {
  const { lines, hydrated, setQty, remove, subtotalCents, clear } = useCart();
  const [totals, setTotals] = useState<Totals | null>(null);
  const [priced, setPriced] = useState<Record<number, PricedLine>>({});
  const [coupon, setCoupon] = useState(""); const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (lines.length === 0) { setTotals(null); return; }
    const ctrl = new AbortController();
    fetch("/api/cart/price", { method: "POST", headers: { "Content-Type": "application/json" }, signal: ctrl.signal,
      body: JSON.stringify({ items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })), couponCode: appliedCoupon }) })
      .then((r) => r.json()).then((d) => {
        if (d.totals) setTotals(d.totals);
        if (d.lines) setPriced(Object.fromEntries((d.lines as PricedLine[]).map((l) => [l.productId, l])));
        if (d.totals?.couponError) { setCouponMsg(d.totals.couponError); setAppliedCoupon(null); }
      }).catch(() => {});
    return () => ctrl.abort();
  }, [lines, hydrated, appliedCoupon]);

  useEffect(() => { try { const c = sessionStorage.getItem("fruitly.coupon"); if (c) setAppliedCoupon(c); } catch {} }, []);
  useEffect(() => { try { if (appliedCoupon) sessionStorage.setItem("fruitly.coupon", appliedCoupon); else sessionStorage.removeItem("fruitly.coupon"); } catch {} }, [appliedCoupon]);

  const applyCoupon = async () => {
    setCouponMsg(null);
    const res = await fetch("/api/coupons/check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: coupon, subtotalCents }) });
    const d = await res.json();
    if (!res.ok) { setCouponMsg(d.error ?? "Invalid coupon"); return; }
    setAppliedCoupon(d.code); setCoupon(""); setCouponMsg(`Coupon ${d.code} applied — you save ${formatMoney(d.discountCents)}.`);
  };

  if (!hydrated) return <div className="mt-6 h-40 animate-pulse rounded-2xl bg-white" />;
  if (lines.length === 0) return (
    <div className="card mt-6 p-12 text-center"><h2 className="text-xl font-semibold">Your cart is empty</h2><p className="mt-1 text-sm text-gray-600">Let&apos;s fix that — the mangoes are incredible right now.</p><Link href="/shop" className="btn-primary mt-6">Browse fruit</Link></div>
  );

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-3">
      <div className="card divide-y divide-line lg:col-span-2">
        {lines.map((l) => {
          const p = priced[l.productId]; const unavailable = p && !p.available; const capped = p && p.available && p.quantity < l.quantity;
          const price = p?.priceCents ?? l.priceCents;
          return (
            <div key={l.productId} className="flex gap-4 p-4">
              <Link href={`/shop/${l.slug}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-leaf-50">
                {l.imageUrl ? <img src={l.imageUrl} alt={l.name} className="h-full w-full object-cover" /> : <div className="h-full w-full bg-leaf-50" />}
              </Link>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div><Link href={`/shop/${l.slug}`} className="font-semibold hover:text-leaf-800">{l.name}</Link><p className="text-xs text-gray-500">{formatMoney(price)} / {l.unit}</p>
                    {unavailable && <p className="mt-1 text-xs font-medium text-red-600">No longer available — please remove.</p>}
                    {capped && <p className="mt-1 text-xs font-medium text-amber-700">Only {p.stock} in stock — quantity will be reduced at checkout.</p>}
                  </div>
                  <button onClick={() => remove(l.productId)} className="text-gray-400 hover:text-red-600" aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="inline-flex items-center rounded-xl border border-line bg-white">
                    <button className="px-2.5 py-1.5 hover:text-leaf-800" aria-label="Decrease" onClick={() => setQty(l.productId, l.quantity - 1)}><Minus className="h-4 w-4" /></button>
                    <span className="w-8 text-center text-sm font-semibold tabular-nums">{l.quantity}</span>
                    <button className="px-2.5 py-1.5 hover:text-leaf-800 disabled:opacity-40" aria-label="Increase" disabled={!!p && l.quantity >= p.stock} onClick={() => setQty(l.productId, l.quantity + 1)}><Plus className="h-4 w-4" /></button>
                  </div>
                  <span className="font-bold tabular-nums">{formatMoney(price * l.quantity)}</span>
                </div>
              </div>
            </div>
          );
        })}
        <div className="flex justify-between p-4 text-sm"><Link href="/shop" className="link">← Continue shopping</Link><button onClick={clear} className="text-gray-500 hover:text-red-600">Clear cart</button></div>
      </div>
      <aside className="card h-fit p-5">
        <h2 className="text-lg font-bold">Summary</h2>
        <div className="mt-3 flex gap-2">
          <div className="relative flex-1"><Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="Coupon code" className="input pl-9 py-2 uppercase" /></div>
          <button onClick={applyCoupon} disabled={!coupon} className="btn-secondary btn-sm">Apply</button>
        </div>
        {couponMsg && <p className={`mt-2 text-xs ${appliedCoupon ? "text-leaf-700" : "text-red-600"}`}>{couponMsg}</p>}
        {appliedCoupon && <p className="mt-1 text-xs text-gray-600">Applied: <b>{appliedCoupon}</b> <button className="link" onClick={() => { setAppliedCoupon(null); setCouponMsg(null); }}>remove</button></p>}
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-gray-600">Subtotal</dt><dd className="tabular-nums">{formatMoney(totals?.subtotal ?? subtotalCents)}</dd></div>
          {totals && totals.discount > 0 && <div className="flex justify-between text-leaf-700"><dt>Discount</dt><dd className="tabular-nums">−{formatMoney(totals.discount)}</dd></div>}
          <div className="flex justify-between"><dt className="text-gray-600">Shipping</dt><dd className="tabular-nums">{totals ? (totals.shipping ? formatMoney(totals.shipping) : "Free") : "—"}</dd></div>
          {totals && totals.tax > 0 && <div className="flex justify-between"><dt className="text-gray-600">Tax</dt><dd className="tabular-nums">{formatMoney(totals.tax)}</dd></div>}
          <div className="flex justify-between border-t border-line pt-2 text-base font-bold"><dt>Total</dt><dd className="tabular-nums">{formatMoney(totals?.total ?? subtotalCents)}</dd></div>
        </dl>
        {totals && totals.shipping > 0 && <p className="mt-2 text-xs text-gray-600">Add {formatMoney(Math.max(0, 5000 - (totals.subtotal - totals.discount)))} more for free delivery.</p>}
        <Link href="/checkout" className="btn-accent mt-5 w-full">Checkout <ArrowRight className="h-4 w-4" /></Link>
        <p className="mt-3 text-center text-xs text-gray-500">Card payments via Stripe · Cash on delivery available</p>
      </aside>
    </div>
  );
}
