import { getCurrentAuth } from "@/lib/auth/session";
import { listSessions } from "@/lib/repo/users";
import { SecurityPanel } from "@/components/account/SecurityPanel";
export default async function SecurityPage() {
  const auth = (await getCurrentAuth())!;
  const sessions = await listSessions(auth.user.id);
  return <SecurityPanel sessions={sessions.map((s) => ({ ...s, current: s.id === auth.sid }))} emailVerified={!!auth.user.email_verified} email={auth.user.email} />;
}
