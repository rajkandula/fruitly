/**
 * Pushes production environment variables to the Harakumo project (POST /api/projects/:id/env upserts by key).
 *   APP_URL=https://your-domain npm run harakumo:env
 */
import { loadEnv, log } from "./_shared.mts";
loadEnv();
const { Harakumo } = await import("../src/lib/harakumo");
const hk = new Harakumo();
const projectId = process.env.HARAKUMO_PROJECT_ID;
if (!projectId) { log.err("HARAKUMO_PROJECT_ID missing — run npm run harakumo:setup first"); process.exit(1); }
const KEYS = ["HARAKUMO_API_KEY", "HARAKUMO_BASE_URL", "HARAKUMO_PROJECT_ID", "HARAKUMO_DATABASE_ID", "HARAKUMO_BUCKET_ID", "HARAKUMO_PAYMENTS_ACCOUNT_ID", "HARAKUMO_PAYMENTS_ONBOARDING_URL", "HARAKUMO_AUTH_POOL_ID", "HARAKUMO_AI_ENABLED",
  "APP_NAME", "APP_URL", "AUTH_SECRET", "ADMIN_EMAILS", "MAIL_MODE", "MAIL_FROM_NAME", "CURRENCY", "TAX_RATE", "FREE_SHIPPING_OVER_CENTS", "SHIPPING_FLAT_CENTS", "COD_ENABLED", "DELIVERY_AREA_NAME", "DELIVERY_ZIPS", "DELIVERY_ZONE_NOTE", "DELIVERY_SLOTS", "DELIVERY_SLOT_WEEKS", "PICKUP_ENABLED", "PICKUP_LOCATION", "PICKUP_NOTE", "INVENTORY_MODE", "SERVICE_FEE_CENTS", "PAYMENTS_TRUST_SUCCESS_REDIRECT", "PAYMENTS_WEBHOOK_SECRET", "SESSION_DAYS", "OTP_TTL_MINUTES", "NODE_ENV"];
const overrides: Record<string, string> = { NODE_ENV: "production", MAIL_DEV_MAILBOX: "false" };
let n = 0;
for (const key of KEYS) {
  const value = overrides[key] ?? process.env[key];
  if (value === undefined || value === "") continue;
  await hk.envVars.set(projectId, key, value, "production");
  n++;
}
for (const [k, v] of Object.entries(overrides)) if (!KEYS.includes(k)) { await hk.envVars.set(projectId, k, v, "production"); n++; }
const { env } = await hk.envVars.list(projectId);
log.ok(`pushed ${n} variables; project now has ${env.length}: ${env.map((e) => e.key).join(", ")}`);
