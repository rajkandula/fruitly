import type { Metadata } from "next";
import { WishlistView } from "@/components/shop/WishlistView";
export const metadata: Metadata = { title: "Wishlist" };
export default function WishlistPage() { return <div className="container-x py-8"><h1 className="text-3xl font-bold tracking-tight">Your wishlist</h1><WishlistView /></div>; }
