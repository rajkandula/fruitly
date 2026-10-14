import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";
export const metadata: Metadata = { title: "Your cart" };
export default function CartPage() { return <div className="container-x py-8"><h1 className="text-3xl font-bold tracking-tight">Your cart</h1><CartView /></div>; }
