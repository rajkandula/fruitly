"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/** After Stripe redirects back, ask the server to confirm the payment against the provider's session record. */
export function ConfirmPayment({ orderNumber }: { orderNumber: string }) {
  const [state, setState] = useState<"checking" | "paid" | "pending" | "error">("checking");
  const router = useRouter();
  useEffect(() => {
    let tries = 0;
    const run = async () => {
      try {
        const res = await fetch("/api/checkout/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderNumber }) });
        const d = await res.json();
        if (d.order?.payment_status === "paid") { setState("paid"); router.refresh(); return; }
        if (++tries < 4) setTimeout(run, 2500); else setState("pending");
      } catch { setState("error"); }
    };
    run();
  }, [orderNumber, router]);
  if (state === "checking") return <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-leaf-50 px-4 py-2 text-sm text-leaf-800"><Loader2 className="h-4 w-4 animate-spin" />Confirming your payment…</p>;
  if (state === "paid") return <p className="mt-4 rounded-xl bg-leaf-50 px-4 py-2 text-sm font-medium text-leaf-800">Payment confirmed ✓</p>;
  if (state === "pending") return <p className="mt-4 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-800">Your payment is being processed. We&apos;ll email you as soon as it&apos;s confirmed — no need to pay again.</p>;
  return <p className="mt-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">We couldn&apos;t verify the payment status right now. Check your orders page in a moment.</p>;
}
