/**
 * One-shot provisioning on Harakumo:
 *   project → Edge SQLite DB → schema + seed → storage bucket → payments (Stripe Connect) → auth pool → mail check
 * Writes all resulting ids into .env.local. Safe to re-run (reuses existing resources by name).
 *
 *   HARAKUMO_API_KEY=hk_live_… npm run harakumo:setup
 */
import { randomBytes } from "node:crypto";
import { loadEnv, writeEnvLocal, log } from "./_shared.mts";
loadEnv();
const { Harakumo, HarakumoError } = await import("../src/lib/harakumo");

const apiKey = process.env.HARAKUMO_API_KEY;
if (!apiKey) { log.err("HARAKUMO_API_KEY missing. Create one in Harakumo Dashboard → Settings → API Keys and put it in .env.local"); process.exit(1); }
const hk = new Harakumo({ apiKey });
const PROJECT_NAME = process.env.HARAKUMO_PROJECT_NAME || "fruitly-store";
const updates: Record<string, string> = {};

// 1. Project
const { projects, org } = await hk.projects.list();
log.info(`org: ${org.name} (#${org.id}, role ${org.role})`);
let project = projects.find((p) => p.name === PROJECT_NAME || String(p.id) === process.env.HARAKUMO_PROJECT_ID);
if (!project) { project = (await hk.projects.create({ name: PROJECT_NAME, framework: "Next.js" })).project; log.ok(`created project ${project.name} (#${project.id})`); }
else log.ok(`using project ${project.name} (#${project.id})`);
updates.HARAKUMO_PROJECT_ID = String(project.id);

// 2. Database
const { databases } = await hk.databases.list(project.id);
let database = databases.find((d) => d.engine === "sqlite" && (String(d.id) === process.env.HARAKUMO_DATABASE_ID || d.name === "fruitly")) ?? databases.find((d) => d.engine === "sqlite");
if (!database) { database = (await hk.databases.create(project.id, { name: "fruitly", engine: "sqlite" })).database; log.ok(`created database ${database.name} (#${database.id}, ${database.provider})`); }
else log.ok(`using database ${database.name} (#${database.id})`);
updates.HARAKUMO_DATABASE_ID = String(database.id);
process.env.HARAKUMO_DATABASE_ID = updates.HARAKUMO_DATABASE_ID;

// 3. Storage bucket
const { buckets } = await hk.storage.list(project.id);
let bucket = buckets.find((b) => String(b.id) === process.env.HARAKUMO_BUCKET_ID) ?? buckets.find((b) => b.name === "fruitly-media") ?? buckets[0];
if (!bucket) { bucket = (await hk.storage.create(project.id, { name: "fruitly-media" })).bucket; log.ok(`created bucket ${bucket.name} (#${bucket.id})`); }
else log.ok(`using bucket ${bucket.name} (#${bucket.id})`);
updates.HARAKUMO_BUCKET_ID = String(bucket.id);

// 4. Payments (Stripe Connect)
try {
  const st = await hk.payments.status(project.id);
  if (st.account?.id) {
    updates.HARAKUMO_PAYMENTS_ACCOUNT_ID = String(st.account.id);
    const a = st.account as Record<string, unknown>;
    const live = Number(a.charges_enabled ?? 0) === 1;
    log.ok(`payments account #${st.account.id} (${a.stripe_account_id ?? "stripe"}) — onboarding ${a.onboarding_status ?? "?"}, charges ${live ? "enabled ✓" : "not yet enabled"}`);
    if (!live) log.warn(process.env.HARAKUMO_PAYMENTS_ONBOARDING_URL ? `finish Stripe onboarding: ${process.env.HARAKUMO_PAYMENTS_ONBOARDING_URL}` : "finish Stripe onboarding from the Harakumo dashboard; card checkout turns on automatically once charges are enabled");
  } else {
    const { account, onboardingUrl } = await hk.payments.enable(project.id);
    updates.HARAKUMO_PAYMENTS_ACCOUNT_ID = String(account.id);
    log.ok(`payments enabled (account #${account.id})`);
    if (onboardingUrl) { updates.HARAKUMO_PAYMENTS_ONBOARDING_URL = onboardingUrl; log.warn(`complete Stripe onboarding: ${onboardingUrl}`); }
  }
} catch (err) {
  log.warn(`payments not enabled: ${err instanceof HarakumoError ? err.message : String(err)}`);
  log.warn("card checkout will be hidden; cash-on-delivery stays available. Re-run this script once the Stripe platform profile is completed.");
}

// 5. Auth pool (used as a user directory mirror; our app does its own password/OTP auth)
try {
  const st = await hk.auth.status(project.id);
  if (st.pool?.id) { updates.HARAKUMO_AUTH_POOL_ID = String(st.pool.id); log.ok(`auth pool #${st.pool.id} already enabled`); }
  else { const { pool } = await hk.auth.enable(project.id); updates.HARAKUMO_AUTH_POOL_ID = String(pool.id); log.ok(`auth pool enabled (#${pool.id})`); }
} catch (err) { log.warn(`auth pool not enabled: ${err instanceof Error ? err.message : err}`); }

// 6. App secrets
if (!process.env.AUTH_SECRET) { updates.AUTH_SECRET = randomBytes(48).toString("base64url"); log.ok("generated AUTH_SECRET"); }
if (!process.env.PAYMENTS_WEBHOOK_SECRET) { updates.PAYMENTS_WEBHOOK_SECRET = randomBytes(24).toString("base64url"); }
if (!process.env.APP_URL) updates.APP_URL = "http://localhost:3000";
if (!process.env.MAIL_MODE) updates.MAIL_MODE = "harakumo";
writeEnvLocal(updates);
log.ok(".env.local updated");

// 7. Schema + seed
const { resetDbInstance } = await import("../src/lib/db");
resetDbInstance();
const { db } = await import("../src/lib/db");
const { migrate } = await import("../src/lib/db/migrate");
const d = await db();
const ran = await migrate(d, log.info);
log.ok(ran.length ? `migrations applied: ${ran.join(", ")}` : "schema up to date");
await import("./seed.mts");

// 8. Mail check
const adminEmail = (process.env.ADMIN_EMAILS ?? "").split(",")[0]?.trim();
if (adminEmail && process.env.SKIP_MAIL_TEST !== "1") {
  try {
    const { message } = await hk.mail.send({ to: adminEmail, subject: `${process.env.APP_NAME ?? "Fruitly"} setup complete ✅`, text: `Harakumo provisioning finished.\nProject #${project.id}, database #${database.id}, bucket #${bucket.id}.\nStart the app with: npm run dev` });
    log.ok(`mail test sent to ${adminEmail} (status: ${message.status}, via ${message.provider})`);
  } catch (err) { log.warn(`mail test failed: ${err instanceof Error ? err.message : err}`); }
}
log.ok("setup complete — run `npm run dev`");
