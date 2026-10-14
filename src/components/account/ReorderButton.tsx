"use client";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { useCart } from "../cart/CartProvider";
import { useToast } from "../Toaster";
import type { OrderItem } from "@/lib/types";
export function ReorderButton({ items }: { items: OrderItem[] }) {
  const { add } = useCart(); const { toast } = useToast(); const router = useRouter();
  const reorder = async () => {
    const ids = items.map((i) => i.product_id).filter((x): x is number => !!x);
    const res = await fetch(`/api/products?ids=${ids.join(",")}`); const d = await res.json();
    let n = 0;
    for (const p of d.products ?? []) { const it = items.find((i) => i.product_id === p.id); if (it && p.stock > 0) { add({ productId: p.id, slug: p.slug, name: p.name, unit: p.unit, priceCents: p.price_cents, imageUrl: p.image_url, emoji: p.emoji, stock: p.stock }, Math.min(it.quantity, p.stock)); n++; } }
    toast(n ? `Added ${n} item${n === 1 ? "" : "s"} to your cart` : "Those items are no longer available", n ? "success" : "info");
    if (n) router.push("/cart");
  };
  return <button onClick={reorder} className="btn-secondary w-full"><RotateCcw className="h-4 w-4" />Reorder these items</button>;
}
