import { loadEnv, log } from "./_shared.mts";
loadEnv();
const { db } = await import("../src/lib/db");
const { migrate } = await import("../src/lib/db/migrate");
const database = await db();
log.info(`database: ${database.kind}`);
const ran = await migrate(database, log.info);
log.ok(ran.length ? `applied ${ran.join(", ")}` : "schema up to date");
