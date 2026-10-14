import { handler, json } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/session";

export const GET = handler(async () => {
  const user = await getCurrentUser();
  return json({ user });
});
