import { handler, json } from "@/lib/api";
import { destroyCurrentSession } from "@/lib/auth/session";

export const POST = handler(async () => {
  await destroyCurrentSession();
  return json({ ok: true });
});
