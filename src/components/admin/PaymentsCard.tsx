"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, ExternalLink } from "lucide-react";
import type { PaymentsReadiness } from "@/lib/payments";

export function PaymentsCard({ initial, cod }: { initial: PaymentsReadiness; cod: boolean }) {
  const [s, setS] = useState(initial); const [busy, setBusy] = useState(false); const router = useRouter();
  const refresh = async () => { setBusy(true); const r = await fetch("/api/admin/payments", { method: "POST" }); if (r.ok) setS(await r.json()); setBusy(false); router.refresh(); };
  return (
    <div className="card p-5 text-sm">
      <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Payments</h2><button onClick={refresh} disabled={busy} className="btn-ghost btn-sm" title="Re-check Stripe status"><RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />Refresh</button></div>
      <ul className="mt-3 space-y-1.5">
        <li className="flex justify-between"><span>Card (Stripe Connect)</span>
          <span className={`font-medium ${s.ready ? "text-leaf-800" : s.configured ? "text-amber-700" : "text-gray-500"}`}>{s.ready ? "Live ✓" : s.configured ? `Onboarding ${s.onboardingStatus ?? "pending"}` : "Not enabled"}</span></li>
        {s.stripeAccountId && <li className="flex justify-between text-xs text-gray-500"><span>Account</span><span className="font-mono">{s.stripeAccountId}{s.mode ? ` · ${s.mode}` : ""}</span></li>}
        <li className="flex justify-between"><span>Charges / payouts</span><span className="text-xs">{s.chargesEnabled ? "✓" : "✗"} / {s.payoutsEnabled ? "✓" : "✗"}</span></li>
        <li className="flex justify-between"><span>Cash on delivery</span><span className="font-medium text-leaf-800">{cod ? "On" : "Off"}</span></li>
      </ul>
      {s.configured && !s.ready && (
        <div className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
          Card checkout is hidden until Stripe onboarding is complete.{s.onboardingUrl && <> <a href={s.onboardingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold underline">Finish onboarding <ExternalLink className="h-3 w-3" /></a>, then hit Refresh.</>}
        </div>
      )}
    </div>
  );
}
