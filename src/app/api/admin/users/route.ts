import { handler, json, requireAdmin } from "@/lib/api";
import { listUsers } from "@/lib/repo/users";
export const GET = handler(async () => { await requireAdmin(); return json({ users: await listUsers(200) }); });
