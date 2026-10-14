import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { AccountNav } from "@/components/account/AccountNav";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");
  return (
    <div className="container-x py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-sm text-gray-500">Account</p><h1 className="text-3xl font-bold tracking-tight">Hi, {user.name.split(" ")[0]}</h1></div>
        {user.role === "admin" && <Link href="/admin" className="btn-secondary btn-sm">Admin dashboard</Link>}
      </div>
      {!user.email_verified && <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Your email isn&apos;t verified yet. <Link href={`/verify-email?email=${encodeURIComponent(user.email)}`} className="font-semibold underline">Verify now</Link> to place orders.</div>}
      <div className="grid gap-6 lg:grid-cols-4">
        <AccountNav />
        <div className="lg:col-span-3">{children}</div>
      </div>
    </div>
  );
}
