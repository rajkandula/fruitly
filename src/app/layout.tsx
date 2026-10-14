import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartProvider } from "@/components/cart/CartProvider";
import { ToasterProvider } from "@/components/Toaster";
import { WishlistProvider } from "@/components/shop/WishlistProvider";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: { default: "Fruitly — Fresh fruit, delivered", template: "%s · Fruitly" },
  description: "Farm-fresh fruit picked at peak ripeness and delivered to your door. Tropical, citrus, berries, gift boxes and more.",
  metadataBase: new URL(env.appUrl),
  openGraph: { title: "Fruitly — Fresh fruit, delivered", description: "Farm-fresh fruit picked at peak ripeness and delivered to your door.", type: "website" },
  icons: { icon: "/icon.svg" },
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <ToasterProvider>
          <CartProvider>
            <WishlistProvider>
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </WishlistProvider>
          </CartProvider>
        </ToasterProvider>
      </body>
    </html>
  );
}
