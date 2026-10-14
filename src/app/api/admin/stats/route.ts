import { handler, json, requireAdmin } from "@/lib/api";
import { adminStats } from "@/lib/repo/orders";
export const GET = handler(async () => { await requireAdmin(); return json(await adminStats()); });
