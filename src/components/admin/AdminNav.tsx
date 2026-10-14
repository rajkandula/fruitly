"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, Users, Tag, FolderTree, ShoppingBasket } from "lucide-react";
import { cn } from "@/lib/utils";
const icons = { dashboard: LayoutDashboard, products: Package, orders: ShoppingCart, users: Users, coupons: Tag, categories: FolderTree, shopping: ShoppingBasket };
export function AdminNav({ items }: { items: { href: string; label: string; icon: keyof typeof icons }[] }) {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-line bg-white p-1.5">
      {items.map((it) => { const Icon = icons[it.icon]; const active = it.href === "/admin" ? path === "/admin" : path.startsWith(it.href);
        return <Link key={it.href} href={it.href} className={cn("flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium", active ? "bg-leaf-800 text-white" : "hover:bg-leaf-50")}><Icon className="h-4 w-4" />{it.label}</Link>; })}
    </nav>
  );
}
