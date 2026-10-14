import { handler, json, requireUser } from "@/lib/api";
import { listOrdersForUser } from "@/lib/repo/orders";
export const GET = handler(async () => { const user = await requireUser(); return json({ orders: await listOrdersForUser(user.id) }); });
