import { env } from "./env";
import { harakumo } from "./harakumo";
import type { HkPaymentSession } from "./harakumo";
import { cached, invalidate } from "./cache";

export interface PaymentsReadiness {
  /** An account id is configured and the API key is present. */
  configured: boolean;
  /** Stripe onboarding complete — card checkout can be offered. */
  ready: boolean;
  onboardingStatus: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  stripeAccountId: string | null;
  onboardingUrl: string | null;
  mode: string | null;
}

const NOT_CONFIGURED: PaymentsReadiness = { configured: false, ready: false, onboardingStatus: null, chargesEnabled: false, payoutsEnabled: false, stripeAccountId: null, onboardingUrl: env.harakumoPaymentsOnboardingUrl || null, mode: null };

/**
 * Live readiness of Harakumo Payments (Stripe Connect), cached for 60s.
 * Card checkout is only offered when the connected account has finished onboarding (charges_enabled).
 */
export async function paymentsReadiness(): Promise<PaymentsReadiness> {
  const hk = harakumo();
  if (!hk || !env.harakumoPaymentsAccountId || !env.harakumoProjectId) return NOT_CONFIGURED;
  return cached("payments:readiness", 60_000, async () => {
    try {
      const { account } = await hk.payments.status(env.harakumoProjectId);
      if (!account) return { ...NOT_CONFIGURED, configured: true };
      const a = account as Record<string, unknown>;
      const charges = Number(a.charges_enabled ?? 0) === 1 || a.charges_enabled === true;
      const onboarding = String(a.onboarding_status ?? "");
      return {
        configured: true,
        ready: charges || onboarding === "complete" || onboarding === "completed",
        onboardingStatus: onboarding || null,
        chargesEnabled: charges,
        payoutsEnabled: Number(a.payouts_enabled ?? 0) === 1 || a.payouts_enabled === true,
        stripeAccountId: (a.stripe_account_id as string | undefined) ?? null,
        onboardingUrl: env.harakumoPaymentsOnboardingUrl || null,
        mode: (a.mode as string | undefined) ?? null,
      };
    } catch (err) {
      console.warn("[payments] status check failed:", err instanceof Error ? err.message : err);
      return { ...NOT_CONFIGURED, configured: true };
    }
  });
}
export function refreshPaymentsReadiness() { invalidate("payments:"); }

/** Whether card checkout (Harakumo Payments / Stripe Connect) can be offered right now. */
export async function cardPaymentsEnabled(): Promise<boolean> {
  return (await paymentsReadiness()).ready;
}

export interface CheckoutSessionResult { sessionId: string | null; url: string | null; raw: HkPaymentSession }

function pickUrl(s: HkPaymentSession): string | null {
  const candidates = [s.url, s.checkout_url, (s as { checkoutUrl?: string }).checkoutUrl, (s as { payment_url?: string }).payment_url, (s as { hosted_url?: string }).hosted_url];
  return (candidates.find((c) => typeof c === "string" && c.startsWith("http")) as string | undefined) ?? null;
}

/** Creates a hosted checkout session for an order. Harakumo applies its platform fee automatically. */
export async function createCheckoutSession(input: { orderNumber: string; amountCents: number; email: string; description: string }): Promise<CheckoutSessionResult> {
  const hk = harakumo();
  if (!hk || !env.harakumoPaymentsAccountId) throw new Error("Card payments are not configured");
  const successUrl = `${env.appUrl}/checkout/success?order=${encodeURIComponent(input.orderNumber)}`;
  const cancelUrl = `${env.appUrl}/checkout/cancel?order=${encodeURIComponent(input.orderNumber)}`;
  const { session } = await hk.payments.createSession(env.harakumoPaymentsAccountId, {
    amountCents: input.amountCents,
    description: input.description,
    currency: env.currency.toLowerCase(),
    customerEmail: input.email,
    successUrl, cancelUrl,
    success_url: successUrl, cancel_url: cancelUrl,
    metadata: { order_number: input.orderNumber },
    reference: input.orderNumber,
    client_reference_id: input.orderNumber,
  });
  const id = session?.id !== undefined ? String(session.id) : ((session as { session_id?: string })?.session_id ?? null);
  return { sessionId: id, url: pickUrl(session ?? {}), raw: session ?? {} };
}

const PAID_STATES = new Set(["paid", "complete", "completed", "succeeded", "success"]);

/**
 * Looks up a session in the project's payment session list (GET /api/projects/:id/payments)
 * and reports whether it's paid. Returns null when the session cannot be found/verified.
 */
export async function verifyCheckoutSession(sessionId: string | null, orderNumber: string): Promise<boolean | null> {
  const hk = harakumo();
  if (!hk || !env.harakumoProjectId) return null;
  try {
    const { sessions } = await hk.payments.status(env.harakumoProjectId);
    const s = (sessions ?? []).find((x) => {
      const sid = x.id !== undefined ? String(x.id) : undefined;
      const stripeId = String((x as { stripe_session_id?: string; session_key?: string }).stripe_session_id ?? (x as { session_key?: string }).session_key ?? "");
      const meta = (x as { metadata?: Record<string, unknown> | string }).metadata;
      const metaStr = typeof meta === "string" ? meta : JSON.stringify(meta ?? {});
      const desc = String(x.description ?? "");
      return (sessionId && (sid === sessionId || stripeId === sessionId)) || metaStr.includes(orderNumber) || desc.includes(orderNumber);
    });
    if (!s) return null;
    const status = String((s as { payment_status?: string }).payment_status ?? s.status ?? "").toLowerCase();
    if (PAID_STATES.has(status)) return true;
    if (["open", "pending", "unpaid", "created"].includes(status)) return false;
    return null;
  } catch (err) {
    console.warn("[payments] verify failed:", err instanceof Error ? err.message : err);
    return null;
  }
}
