import { getCurrentUser } from "@/lib/auth/session";
import { listCategories } from "@/lib/repo/products";
import { HeaderClient } from "./HeaderClient";
import { Logo } from "./Logo";

export async function Header() {
  const [user, categories] = await Promise.all([getCurrentUser(), listCategories().catch(() => [])]);
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-cream/85 backdrop-blur supports-[backdrop-filter]:bg-cream/70">
      <div className="bg-leaf-800 text-center text-xs font-medium text-leaf-50">
        <div className="container-x py-1.5">Free delivery on orders over $50 · Use <b>WELCOME10</b> for 10% off your first order</div>
      </div>
      <HeaderClient user={user ? { name: user.name, role: user.role } : null} categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}>
        <Logo />
      </HeaderClient>
    </header>
  );
}
