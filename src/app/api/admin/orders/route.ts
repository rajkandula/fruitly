import { handler, json, requireAdmin } from "@/lib/api";
import { listAllOrders } from "@/lib/repo/orders";
export const GET = handler(async (req) => {
  await requireAdmin();
  const u = new URL(req.url);
  return json(await listAllOrders({ status: u.searchParams.get("status") ?? undefined, q: u.searchParams.get("q") ?? undefined, limit: Number(u.searchParams.get("limit") ?? 100), offset: Number(u.searchParams.get("offset") ?? 0) }));
});
