import { handler, json, parseBody } from "@/lib/api";
import { newsletterSchema } from "@/lib/validation";
import { db } from "@/lib/db";
export const POST = handler(async (req) => {
  const { email } = await parseBody(req, newsletterSchema);
  const database = await db();
  await database.run("INSERT OR IGNORE INTO newsletter_subscribers (email) VALUES (?)", [email]);
  return json({ ok: true });
});
