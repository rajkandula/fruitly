import { handler, json } from "@/lib/api";
import { cardPaymentsEnabled } from "@/lib/payments";
import { env } from "@/lib/env";
import { fulfillmentConfig } from "@/lib/delivery";
export const GET = handler(async () => json({ card: await cardPaymentsEnabled(), cod: env.codEnabled, currency: env.currency, freeShippingOverCents: env.freeShippingOverCents, shippingFlatCents: env.shippingFlatCents, fulfillment: fulfillmentConfig() }));
