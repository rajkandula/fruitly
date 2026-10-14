import Link from "next/link";
import { Logo } from "./Logo";
import { NewsletterForm } from "./NewsletterForm";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-white">
      <div className="container-x grid gap-10 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo size="sm" href="/" />
          <p className="mt-3 max-w-sm text-sm text-gray-600">Farm-fresh fruit, picked at peak ripeness and delivered to your door. Built on Harakumo — edge database, storage, mail and payments from one API.</p>
          <NewsletterForm />
        </div>
        <div>
          <h4 className="text-sm font-semibold">Shop</h4>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li><Link href="/shop" className="hover:text-leaf-800">All fruit</Link></li>
            <li><Link href="/shop?category=tropical" className="hover:text-leaf-800">Tropical</Link></li>
            <li><Link href="/shop?category=berries" className="hover:text-leaf-800">Berries</Link></li>
            <li><Link href="/shop?category=boxes" className="hover:text-leaf-800">Gift boxes</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Account</h4>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li><Link href="/account" className="hover:text-leaf-800">My account</Link></li>
            <li><Link href="/account/orders" className="hover:text-leaf-800">Orders</Link></li>
            <li><Link href="/login" className="hover:text-leaf-800">Sign in</Link></li>
            <li><Link href="/signup" className="hover:text-leaf-800">Create account</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-5 text-xs text-gray-500 sm:flex-row">
          <span>© {new Date().getFullYear()} Fruitly. Fresh every day.</span>
          <span>Payments secured by Stripe · Email by Harakumo Mail · <Link href="/credits" className="hover:text-leaf-800">Photo credits</Link></span>
        </div>
      </div>
    </footer>
  );
}
