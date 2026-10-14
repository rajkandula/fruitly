/** Usage: npm run db:query -- "SELECT * FROM users LIMIT 5" */
import { loadEnv } from "./_shared.mts";
loadEnv();
const { db } = await import("../src/lib/db");
const sql = process.argv.slice(2).join(" ").trim();
if (!sql) { console.error('usage: npm run db:query -- "SELECT 1"'); process.exit(1); }
const database = await db();
const rows = await database.query(sql);
console.table(rows);
