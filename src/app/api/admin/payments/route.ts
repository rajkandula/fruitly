import { handler, json, requireAdmin } from "@/lib/api";
import { paymentsReadiness, refreshPaymentsReadiness } from "@/lib/payments";
export const GET = handler(async () => { await requireAdmin(); return json(await paymentsReadiness()); });
/** Force a fresh status check (e.g. right after finishing Stripe onboarding). */
export const POST = handler(async () => { await requireAdmin(); refreshPaymentsReadiness(); return json(await paymentsReadiness()); });
