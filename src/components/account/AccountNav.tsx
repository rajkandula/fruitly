"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User, Package, MapPin, ShieldCheck, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
const items = [
  { href: "/account", label: "Overview", icon: User },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/security", label: "Security", icon: ShieldCheck },
];
export function AccountNav() {
  const path = usePathname(); const router = useRouter();
  const logout = async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/"); router.refresh(); };
  return (
    <nav className="card h-fit p-2">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/account" ? path === href : path.startsWith(href);
        return <Link key={href} href={href} className={cn("flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium", active ? "bg-leaf-800 text-white" : "hover:bg-leaf-50")}><Icon className="h-4 w-4" />{label}</Link>;
      })}
      <button onClick={logout} className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-700"><LogOut className="h-4 w-4" />Sign out</button>
    </nav>
  );
}
