/**
 * Centralised, typed access to environment configuration.
 * Nothing here throws at import time so that `next build` works without secrets;
 * callers that truly need a value use the `require*` helpers.
 */

function str(name: string, fallback = ""): string {
  const v = process.env[name];
  return v === undefined || v === "" ? fallback : v;
}
function num(name: string, fallback: number): number {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && process.env[name] !== undefined && process.env[name] !== "" ? v : fallback;
}
function bool(name: string, fallback = false): boolean {
  const v = process.env[name];
  if (v === undefined || v === "") return fallback;
  return ["1", "true", "yes", "on"].includes(v.toLowerCase());
}

export const env = {
  get nodeEnv() { return str("NODE_ENV", "development"); },
  get isProd() { return this.nodeEnv === "production"; },

  // --- Harakumo ---
  get harakumoApiKey() { return str("HARAKUMO_API_KEY"); },
  get harakumoBaseUrl() { return str("HARAKUMO_BASE_URL", "https://harakumo.com"); },
  get harakumoProjectId() { return str("HARAKUMO_PROJECT_ID"); },
  get harakumoDatabaseId() { return str("HARAKUMO_DATABASE_ID"); },
  get harakumoBucketId() { return str("HARAKUMO_BUCKET_ID"); },
  get harakumoPaymentsAccountId() { return str("HARAKUMO_PAYMENTS_ACCOUNT_ID"); },
  get harakumoPaymentsOnboardingUrl() { return str("HARAKUMO_PAYMENTS_ONBOARDING_URL"); },
  get harakumoAuthPoolId() { return str("HARAKUMO_AUTH_POOL_ID"); },
  get harakumoAiEnabled() { return bool("HARAKUMO_AI_ENABLED", true); },

  // --- App ---
  get appName() { return str("APP_NAME", "Fruitly"); },
  get appUrl() { return str("APP_URL", "http://localhost:3000").replace(/\/$/, ""); },
  get authSecret() { return str("AUTH_SECRET"); },
  get adminEmails() {
    return str("ADMIN_EMAILS").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  },
  get sessionDays() { return num("SESSION_DAYS", 30); },
  get otpTtlMinutes() { return num("OTP_TTL_MINUTES", 10); },

  // --- Mail ---
  /** "harakumo" | "dev" (console + in-memory dev mailbox) */
  get mailMode() { return str("MAIL_MODE", this.harakumoApiKey ? "harakumo" : "dev"); },
  get mailFromName() { return str("MAIL_FROM_NAME", this.appName); },
  get mailDevMailbox() { return bool("MAIL_DEV_MAILBOX", !this.isProd); },

  // --- Commerce ---
  get currency() { return str("CURRENCY", "USD"); },
  get taxRate() { return num("TAX_RATE", 0.0); },
  get freeShippingOverCents() { return num("FREE_SHIPPING_OVER_CENTS", 5000); },
  get shippingFlatCents() { return num("SHIPPING_FLAT_CENTS", 599); },
  get codEnabled() { return bool("COD_ENABLED", true); },

  // --- Fulfilment (local delivery zone + pickup) ---
  get deliveryAreaName() { return str("DELIVERY_AREA_NAME", "our delivery area"); },
  /** Postal codes we deliver to. Empty = deliver anywhere. */
  get deliveryZips() { return str("DELIVERY_ZIPS").split(",").map((s) => s.trim()).filter(Boolean); },
  get deliveryZoneNote() { return str("DELIVERY_ZONE_NOTE", ""); },
  /** "Tue:17-20,Thu:17-20,Sat:10-13" — weekday plus 24h start/end. */
  get deliverySlots() { return str("DELIVERY_SLOTS", "Tue:17-20,Thu:17-20,Sat:10-13"); },
  get deliverySlotWeeks() { return num("DELIVERY_SLOT_WEEKS", 2); },
  get pickupEnabled() { return bool("PICKUP_ENABLED", false); },
  get pickupLocation() { return str("PICKUP_LOCATION", ""); },
  get pickupNote() { return str("PICKUP_NOTE", ""); },

  /**
   * "stocked"       — we hold inventory; stock is reserved and decremented (classic shop).
   * "made_to_order" — we buy each order fresh from our suppliers/stores after it's placed:
   *                   no stock reservation, items stay orderable, customers pick a substitution preference.
   */
  get inventoryMode() { return str("INVENTORY_MODE", "stocked") === "made_to_order" ? "made_to_order" as const : "stocked" as const; },
  get madeToOrder() { return this.inventoryMode === "made_to_order"; },
  get serviceFeeCents() { return num("SERVICE_FEE_CENTS", 0); },
  /** Trust the Stripe success redirect as payment confirmation when no verification source is available. */
  get paymentsTrustSuccessRedirect() { return bool("PAYMENTS_TRUST_SUCCESS_REDIRECT", false); },
  get paymentsWebhookSecret() { return str("PAYMENTS_WEBHOOK_SECRET"); },

  // --- Local DB fallback ---
  get localDbPath() { return str("LOCAL_DB_PATH", "data/fruitly.local.db"); },
};

export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable ${name}`);
  return v;
}
