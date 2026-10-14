import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, Users, Store } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") redirect("/account");
  return (
    <div className="container-x py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-sm text-gray-500">Admin</p><h1 className="text-3xl font-bold tracking-tight">Store management</h1></div>
        <Link href="/" className="btn-secondary btn-sm"><Store className="h-4 w-4" />View store</Link>
      </div>
      <AdminNav items={[
        { href: "/admin", label: "Dashboard", icon: "dashboard" }, { href: "/admin/products", label: "Products", icon: "products" },
        { href: "/admin/orders", label: "Orders", icon: "orders" }, { href: "/admin/users", label: "Customers", icon: "users" },
        { href: "/admin/shopping-list", label: "Shopping list", icon: "shopping" },
        { href: "/admin/coupons", label: "Coupons", icon: "coupons" }, { href: "/admin/categories", label: "Categories", icon: "categories" },
      ]} />
      <div className="mt-6">{children}</div>
      <span className="hidden"><LayoutDashboard /><Package /><ShoppingCart /><Users /></span>
    </div>
  );
}
