/** Usage: npm run admin:promote -- you@example.com */
import { loadEnv, log } from "./_shared.mts";
loadEnv();
const { db } = await import("../src/lib/db");
const email = (process.argv[2] ?? "").trim().toLowerCase();
if (!email) { log.err("usage: npm run admin:promote -- you@example.com"); process.exit(1); }
const database = await db();
const res = await database.run("UPDATE users SET role='admin' WHERE email = ?", [email]);
if (res.changes) log.ok(`${email} is now an admin`); else log.warn(`no user found for ${email} (sign up first, or add to ADMIN_EMAILS before signing up)`);
