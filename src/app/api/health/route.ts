import { handler, json } from "@/lib/api";
import { db } from "@/lib/db";
import { cardPaymentsEnabled } from "@/lib/payments";
import { storageEnabled } from "@/lib/storage";
import { env } from "@/lib/env";
export const GET = handler(async () => {
  const database = await db();
  const t0 = Date.now();
  await database.get("SELECT 1 AS ok");
  return json({ ok: true, db: database.kind, dbLatencyMs: Date.now() - t0, mail: env.mailMode, payments: (await cardPaymentsEnabled()) ? "card+cod" : "cod", storage: storageEnabled(), time: new Date().toISOString() });
});
