"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CreditCard, Banknote, Loader2, MapPin, Lock, Store, Truck, CalendarClock } from "lucide-react";
import { useCart } from "./CartProvider";
import { useToast } from "../Toaster";
import { formatMoney, cn } from "@/lib/utils";
import type { Address } from "@/lib/types";

interface Totals { subtotal: number; shipping: number; tax: number; discount: number; serviceFee: number; total: number; couponCode: string | null; couponError?: string }
interface Slot { id: string; label: string }
interface Fulfilment { areaName: string; zips: string[]; zoneNote: string; slots: Slot[]; pickup: { enabled: boolean; location: string; note: string } }
const EMPTY = { label: "Home", full_name: "", line1: "", line2: "", city: "", state: "", postal_code: "", country: "US", phone: "" };

export function CheckoutForm({ addresses, user, payments, fulfilment, madeToOrder }: { addresses: Address[]; user: { name: string; phone: string | null }; payments: { card: boolean; cod: boolean }; fulfilment: Fulfilment; madeToOrder: boolean }) {
  const { lines, hydrated, clear } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const [addressId, setAddressId] = useState<number | "new">(addresses.find((a) => a.is_default)?.id ?? addresses[0]?.id ?? "new");
  const [addr, setAddr] = useState({ ...EMPTY, full_name: user.name, phone: user.phone ?? "" });
  const [saveAddress, setSaveAddress] = useState(true);
  const [method, setMethod] = useState<"card" | "cod">(payments.card ? "card" : "cod");
  const [notes, setNotes] = useState("");
  const [mode, setMode] = useState<"delivery" | "pickup">("delivery");
  const [slot, setSlot] = useState(fulfilment.slots[0]?.id ?? "");
  const [contactPhone, setContactPhone] = useState(user.phone ?? "");
  const [subPref, setSubPref] = useState<"substitute" | "refund" | "contact">("contact");
  const [coupon, setCoupon] = useState<string | null>(null);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { try { setCoupon(sessionStorage.getItem("fruitly.coupon")); } catch {} }, []);
  useEffect(() => {
    if (!hydrated || lines.length === 0) return;
    fetch("/api/cart/price", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })), couponCode: coupon, fulfillment: mode }) })
      .then((r) => r.json()).then((d) => { if (d.totals) setTotals(d.totals); if (d.totals?.couponError) setCoupon(null); }).catch(() => {});
  }, [lines, hydrated, coupon, mode]);

  // Postal code of whatever address is currently selected
  const selectedPostal = addressId === "new" ? addr.postal_code : (addresses.find((a) => a.id === addressId)?.postal_code ?? "");
  const zips = fulfilment.zips.map((z) => z.trim().toUpperCase());
  const norm = (v: string) => (v ?? "").trim().replace(/\s+/g, "").split("-")[0].toUpperCase();
  const zoneOk = zips.length === 0 || !selectedPostal || zips.includes(norm(selectedPostal));
  const zoneChecked = Boolean(selectedPostal);

  const addressValid = useMemo(() => {
    if (mode === "pickup") return true;
    return addressId !== "new" || Boolean(addr.full_name.trim().length >= 2 && addr.line1.trim().length >= 3 && addr.city.trim() && addr.postal_code.trim().length >= 3);
  }, [addressId, addr, mode]);
  const slotRequired = fulfilment.slots.length > 0;
  const canSubmit = addressValid && (!slotRequired || Boolean(slot)) && (mode === "pickup" || zoneOk) && Boolean(totals);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setBusy(true);
    try {
      const payload = {
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        fulfillment: mode,
        slot: slot || null,
        ...(mode === "pickup"
          ? { contactName: user.name, contactPhone: contactPhone || null }
          : addressId === "new" ? { address: { ...addr, line2: addr.line2 || null, phone: addr.phone || null }, saveAddress } : { addressId }),
        paymentMethod: method, couponCode: coupon, notes: notes || null, substitutionPref: subPref,
      };
      const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? "Checkout failed"); setBusy(false); return; }
      if (d.redirectUrl) { window.location.href = d.redirectUrl; return; } // cart is cleared on the success page
      clear(); try { sessionStorage.removeItem("fruitly.coupon"); } catch {}
      toast("Order placed!");
      router.push(`/checkout/success?order=${encodeURIComponent(d.orderNumber)}`);
    } catch { setError("Network error. Please try again."); setBusy(false); }
  };

  if (!hydrated) return <div className="mt-6 h-40 animate-pulse rounded-2xl bg-white" />;
  if (lines.length === 0) return <div className="card mt-6 p-10 text-center"><p className="text-lg font-semibold">Your cart is empty.</p><Link href="/shop" className="btn-primary mt-4">Shop fruit</Link></div>;

  return (
    <form onSubmit={submit} className="mt-6 grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {fulfilment.pickup.enabled && (
          <section className="card p-5">
            <h2 className="text-lg font-bold">How would you like to get it?</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <label className={cn("cursor-pointer rounded-xl border p-4 text-sm transition", mode === "delivery" ? "border-leaf-700 bg-leaf-50" : "border-line hover:border-leaf-500")}>
                <input type="radio" name="mode" className="sr-only" checked={mode === "delivery"} onChange={() => setMode("delivery")} />
                <div className="flex items-center gap-2 font-semibold"><Truck className="h-4 w-4" />Local delivery</div>
                <p className="mt-1 text-gray-600">We hand-deliver in {fulfilment.areaName}.</p>
              </label>
              <label className={cn("cursor-pointer rounded-xl border p-4 text-sm transition", mode === "pickup" ? "border-leaf-700 bg-leaf-50" : "border-line hover:border-leaf-500")}>
                <input type="radio" name="mode" className="sr-only" checked={mode === "pickup"} onChange={() => setMode("pickup")} />
                <div className="flex items-center gap-2 font-semibold"><Store className="h-4 w-4" />Pick it up — free</div>
                <p className="mt-1 text-gray-600">{fulfilment.pickup.location || "Collect from us"}</p>
              </label>
            </div>
          </section>
        )}

        {mode === "pickup" ? (
          <section className="card p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold"><Store className="h-5 w-5 text-leaf-700" />Pickup details</h2>
            <p className="mt-3 text-sm text-gray-700">{fulfilment.pickup.location}</p>
            {fulfilment.pickup.note && <p className="mt-1 text-sm text-gray-600">{fulfilment.pickup.note}</p>}
            <div className="mt-4 max-w-xs"><label className="label">Phone <span className="text-gray-400">(so we can text you)</span></label><input className="input" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} /></div>
          </section>
        ) : (
        <section className="card p-5">
          <h2 className="flex items-center gap-2 text-lg font-bold"><MapPin className="h-5 w-5 text-leaf-700" />Delivery address</h2>
          <p className="mt-1 text-sm text-gray-600">We deliver to {fulfilment.areaName}{fulfilment.zoneNote ? ` — ${fulfilment.zoneNote}` : ""}.</p>
          {addresses.length > 0 && (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {addresses.map((a) => (
                <label key={a.id} className={cn("cursor-pointer rounded-xl border p-3 text-sm transition", addressId === a.id ? "border-leaf-700 bg-leaf-50" : "border-line hover:border-leaf-500")}>
                  <input type="radio" name="addr" className="sr-only" checked={addressId === a.id} onChange={() => setAddressId(a.id)} />
                  <div className="flex items-center justify-between"><b>{a.label}</b>{a.is_default ? <span className="badge bg-leaf-100 text-leaf-800">Default</span> : null}</div>
                  <div className="mt-1 text-gray-700">{a.full_name}<br />{a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />{a.city}{a.state ? `, ${a.state}` : ""} {a.postal_code}, {a.country}</div>
                </label>
              ))}
              <label className={cn("cursor-pointer rounded-xl border border-dashed p-3 text-sm transition flex items-center justify-center", addressId === "new" ? "border-leaf-700 bg-leaf-50" : "border-line hover:border-leaf-500")}>
                <input type="radio" name="addr" className="sr-only" checked={addressId === "new"} onChange={() => setAddressId("new")} />+ Use a new address
              </label>
            </div>
          )}
          {addressId === "new" && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div><label className="label">Full name</label><input className="input" required value={addr.full_name} onChange={(e) => setAddr({ ...addr, full_name: e.target.value })} /></div>
              <div><label className="label">Phone</label><input className="input" value={addr.phone} onChange={(e) => setAddr({ ...addr, phone: e.target.value })} placeholder="For delivery updates" /></div>
              <div className="sm:col-span-2"><label className="label">Street address</label><input className="input" required value={addr.line1} onChange={(e) => setAddr({ ...addr, line1: e.target.value })} /></div>
              <div className="sm:col-span-2"><label className="label">Apartment, suite, etc. <span className="text-gray-400">(optional)</span></label><input className="input" value={addr.line2} onChange={(e) => setAddr({ ...addr, line2: e.target.value })} /></div>
              <div><label className="label">City</label><input className="input" required value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} /></div>
              <div><label className="label">State / Region</label><input className="input" value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value })} /></div>
              <div><label className="label">Postal code</label><input className="input" required value={addr.postal_code} onChange={(e) => setAddr({ ...addr, postal_code: e.target.value })} /></div>
              <div><label className="label">Country</label><select className="input" value={addr.country} onChange={(e) => setAddr({ ...addr, country: e.target.value })}>{["US", "CA", "GB", "IN", "AU", "DE", "FR", "SG", "AE"].map((c) => <option key={c}>{c}</option>)}</select></div>
              <div><label className="label">Label</label><input className="input" value={addr.label} onChange={(e) => setAddr({ ...addr, label: e.target.value })} placeholder="Home, Office…" /></div>
              <label className="flex items-center gap-2 self-end text-sm"><input type="checkbox" className="h-4 w-4 accent-leaf-700" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />Save to my account</label>
            </div>
          )}
          {zoneChecked && !zoneOk && (
            <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
              Sorry — {selectedPostal} is outside our delivery area ({fulfilment.zips.join(", ")}).{fulfilment.pickup.enabled ? " You can switch to free pickup above." : ""}
            </p>
          )}
        </section>
        )}

        {fulfilment.slots.length > 0 && (
          <section className="card p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold"><CalendarClock className="h-5 w-5 text-leaf-700" />{mode === "pickup" ? "Pickup" : "Delivery"} window</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {fulfilment.slots.map((sl) => (
                <label key={sl.id} className={cn("cursor-pointer rounded-xl border px-4 py-3 text-sm transition", slot === sl.id ? "border-leaf-700 bg-leaf-50 font-semibold" : "border-line hover:border-leaf-500")}>
                  <input type="radio" name="slot" className="sr-only" checked={slot === sl.id} onChange={() => setSlot(sl.id)} />{sl.label}
                </label>
              ))}
            </div>
          </section>
        )}

        <section className="card p-5">
          <h2 className="flex items-center gap-2 text-lg font-bold"><Lock className="h-5 w-5 text-leaf-700" />Payment</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <label className={cn("rounded-xl border p-4 text-sm transition", payments.card ? "cursor-pointer" : "cursor-not-allowed opacity-60", method === "card" ? "border-leaf-700 bg-leaf-50" : "border-line hover:border-leaf-500")}>
              <input type="radio" name="pm" className="sr-only" disabled={!payments.card} checked={method === "card"} onChange={() => setMethod("card")} />
              <div className="flex items-center gap-2 font-semibold"><CreditCard className="h-4 w-4" />Card (Stripe)</div>
              <p className="mt-1 text-gray-600">{payments.card ? "Secure hosted checkout. Visa, Mastercard, Amex, Apple Pay." : "Temporarily unavailable — card payments are being set up."}</p>
            </label>
            <label className={cn("rounded-xl border p-4 text-sm transition", payments.cod ? "cursor-pointer" : "cursor-not-allowed opacity-60", method === "cod" ? "border-leaf-700 bg-leaf-50" : "border-line hover:border-leaf-500")}>
              <input type="radio" name="pm" className="sr-only" disabled={!payments.cod} checked={method === "cod"} onChange={() => setMethod("cod")} />
              <div className="flex items-center gap-2 font-semibold"><Banknote className="h-4 w-4" />{mode === "pickup" ? "Cash on pickup" : "Cash on delivery"}</div>
              <p className="mt-1 text-gray-600">{mode === "pickup" ? "Pay when you collect your order." : "Pay us when your fruit arrives."}</p>
            </label>
          </div>
          {madeToOrder && (
            <div className="mt-5">
              <label className="label">If something isn&apos;t available that day</label>
              <div className="grid gap-2 sm:grid-cols-3">
                {([["contact", "Contact me", "We'll text before we decide."], ["substitute", "Substitute", "Pick something similar of equal value."], ["refund", "Refund it", "Skip the item and refund it."]] as const).map(([v, t, d]) => (
                  <label key={v} className={cn("cursor-pointer rounded-xl border p-3 text-sm transition", subPref === v ? "border-leaf-700 bg-leaf-50" : "border-line hover:border-leaf-500")}>
                    <input type="radio" name="sub" className="sr-only" checked={subPref === v} onChange={() => setSubPref(v)} />
                    <b>{t}</b><p className="mt-0.5 text-xs text-gray-600">{d}</p>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="mt-4"><label className="label">Delivery notes <span className="text-gray-400">(optional)</span></label><textarea className="input" rows={2} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={mode === "pickup" ? "Anything we should know?" : "Buzzer code, leave with doorman, gift message…"} /></div>
        </section>
      </div>

      <aside className="card h-fit p-5">
        <h2 className="text-lg font-bold">Order summary</h2>
        <ul className="mt-3 divide-y divide-line text-sm">
          {lines.map((l) => <li key={l.productId} className="flex items-center justify-between py-2"><span className="truncate pr-2">{l.name} <span className="text-gray-500">× {l.quantity}</span></span><span className="tabular-nums">{formatMoney(l.priceCents * l.quantity)}</span></li>)}
        </ul>
        <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
          <div className="flex justify-between"><dt className="text-gray-600">Subtotal</dt><dd className="tabular-nums">{formatMoney(totals?.subtotal ?? 0)}</dd></div>
          {totals && totals.discount > 0 && <div className="flex justify-between text-leaf-700"><dt>Discount ({totals.couponCode})</dt><dd>−{formatMoney(totals.discount)}</dd></div>}
          <div className="flex justify-between"><dt className="text-gray-600">{mode === "pickup" ? "Pickup" : "Delivery"}</dt><dd>{totals ? (totals.shipping ? formatMoney(totals.shipping) : "Free") : "—"}</dd></div>
          {totals && totals.serviceFee > 0 && <div className="flex justify-between"><dt className="text-gray-600">Service fee</dt><dd>{formatMoney(totals.serviceFee)}</dd></div>}
          {totals && totals.tax > 0 && <div className="flex justify-between"><dt className="text-gray-600">Tax</dt><dd>{formatMoney(totals.tax)}</dd></div>}
          <div className="flex justify-between border-t border-line pt-2 text-base font-bold"><dt>Total</dt><dd className="tabular-nums">{formatMoney(totals?.total ?? 0)}</dd></div>
        </dl>
        {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={busy || !canSubmit} className="btn-accent mt-5 w-full py-3 text-base">
          {busy ? <><Loader2 className="h-4 w-4 animate-spin" />Placing order…</> : method === "card" ? `Pay ${formatMoney(totals?.total ?? 0)}` : "Place order"}
        </button>
        <p className="mt-3 text-center text-xs text-gray-500">By placing your order you agree to our freshness guarantee terms.</p>
        <Link href="/cart" className="link mt-3 block text-center text-sm">← Back to cart</Link>
      </aside>
    </form>
  );
}
