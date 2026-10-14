"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Menu, Search, ShoppingBasket, User, X, ChevronDown, Shield, LogOut, Package, Heart } from "lucide-react";
import { useCart } from "./cart/CartProvider";

interface Props { user: { name: string; role: string } | null; categories: { slug: string; name: string }[]; children: ReactNode }

export function HeaderClient({ user, categories, children }: Props) {
  const { count, hydrated } = useCart();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const submit = (e: React.FormEvent) => { e.preventDefault(); router.push(q.trim() ? `/shop?q=${encodeURIComponent(q.trim())}` : "/shop"); setOpen(false); };
  const logout = async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/"); router.refresh(); };

  return (
    <div className="container-x">
      <div className="flex h-16 items-center gap-4">
        {children}
        <nav className="ml-6 hidden items-center gap-1 lg:flex">
          <Link href="/shop" className="btn-ghost btn-sm text-sm">Shop all</Link>
          <div className="group relative">
            <button className="btn-ghost btn-sm text-sm">Categories <ChevronDown className="h-3.5 w-3.5" /></button>
            <div className="invisible absolute left-0 top-full z-50 w-64 translate-y-1 rounded-2xl border border-line bg-white p-2 opacity-0 shadow-lift transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              {categories.map((c) => (
                <Link key={c.slug} href={`/shop?category=${c.slug}`} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-leaf-50">{c.name}</Link>
              ))}
            </div>
          </div>
          <Link href="/shop?category=boxes" className="btn-ghost btn-sm text-sm">Gift boxes</Link>
        </nav>
        <form onSubmit={submit} className="relative ml-auto hidden w-full max-w-xs md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search fruit…" className="input pl-9 py-2" aria-label="Search products" />
        </form>
        <div className="ml-auto flex items-center gap-1 md:ml-0">
          {user ? (
            <div className="group relative hidden sm:block">
              <Link href="/account" className="btn-ghost btn-sm text-sm"><User className="h-4 w-4" /><span className="max-w-[8rem] truncate">{user.name.split(" ")[0]}</span></Link>
              <div className="invisible absolute right-0 top-full z-50 w-52 translate-y-1 rounded-2xl border border-line bg-white p-2 opacity-0 shadow-lift transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                <Link href="/account" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-leaf-50"><User className="h-4 w-4" />My account</Link>
                <Link href="/account/orders" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-leaf-50"><Package className="h-4 w-4" />Orders</Link>
                {user.role === "admin" && <Link href="/admin" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-leaf-50"><Shield className="h-4 w-4" />Admin</Link>}
                <button onClick={logout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-red-50 hover:text-red-700"><LogOut className="h-4 w-4" />Sign out</button>
              </div>
            </div>
          ) : (
            <Link href="/login" className="btn-ghost btn-sm hidden text-sm sm:inline-flex"><User className="h-4 w-4" />Sign in</Link>
          )}
          <Link href="/wishlist" className="btn-ghost btn-sm hidden sm:inline-flex" aria-label="Wishlist"><Heart className="h-4 w-4" /></Link>
          <Link href="/cart" className="btn-secondary btn-sm relative" aria-label="Cart">
            <ShoppingBasket className="h-4 w-4" /><span className="hidden sm:inline">Cart</span>
            {hydrated && count > 0 && <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-peel-600 px-1 text-[10px] font-bold text-white">{count}</span>}
          </Link>
          <button className="btn-ghost btn-sm lg:hidden" aria-label="Menu" onClick={() => setOpen((o) => !o)}>{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </div>
      </div>
      {open && (
        <div className="border-t border-line py-3 lg:hidden animate-fade-up">
          <form onSubmit={submit} className="relative mb-3 md:hidden">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search fruit…" className="input pl-9" />
          </form>
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
            <Link href="/shop" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2 text-sm font-medium hover:bg-leaf-50">Shop all</Link>
            {categories.map((c) => <Link key={c.slug} href={`/shop?category=${c.slug}`} onClick={() => setOpen(false)} className="rounded-xl px-3 py-2 text-sm hover:bg-leaf-50">{c.name}</Link>)}
          </div>
          <div className="mt-3 flex gap-2 border-t border-line pt-3">
            {user ? (<>
              <Link href="/account" onClick={() => setOpen(false)} className="btn-secondary btn-sm">My account</Link>
              {user.role === "admin" && <Link href="/admin" onClick={() => setOpen(false)} className="btn-secondary btn-sm">Admin</Link>}
              <button onClick={logout} className="btn-ghost btn-sm">Sign out</button>
            </>) : (<>
              <Link href="/login" onClick={() => setOpen(false)} className="btn-primary btn-sm">Sign in</Link>
              <Link href="/signup" onClick={() => setOpen(false)} className="btn-secondary btn-sm">Create account</Link>
            </>)}
          </div>
        </div>
      )}
    </div>
  );
}
