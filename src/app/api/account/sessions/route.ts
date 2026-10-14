import { handler, json, requireUser } from "@/lib/api";
import { deleteSession, listSessions } from "@/lib/repo/users";
import { destroyAllSessions, getCurrentAuth } from "@/lib/auth/session";

export const GET = handler(async () => {
  const auth = await getCurrentAuth();
  const user = await requireUser();
  const sessions = await listSessions(user.id);
  return json({ sessions: sessions.map((s) => ({ ...s, current: s.id === auth?.sid })) });
});

/** DELETE ?sid=<id> revokes one session; DELETE ?all=1 revokes every other session. */
export const DELETE = handler(async (req) => {
  const auth = await getCurrentAuth();
  const user = await requireUser();
  const url = new URL(req.url);
  if (url.searchParams.get("all")) { await destroyAllSessions(user.id, auth?.sid); return json({ ok: true }); }
  const sid = url.searchParams.get("sid");
  if (sid) await deleteSession(user.id, sid);
  return json({ ok: true });
});
