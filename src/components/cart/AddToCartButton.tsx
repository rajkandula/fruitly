"use client";
import { useState } from "react";
import { ShoppingBasket, Minus, Plus, Check } from "lucide-react";
import { useCart } from "./CartProvider";
import { useToast } from "../Toaster";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AddToCartButton({ product, size = "md", withQty = false, className, madeToOrder = false }: { product: Product; size?: "sm" | "md" | "lg"; withQty?: boolean; className?: string; madeToOrder?: boolean }) {
  const { add, lines } = useCart();
  const { toast } = useToast();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const inCart = lines.find((l) => l.productId === product.id)?.quantity ?? 0;
  const out = madeToOrder ? product.availability === "unavailable" : product.stock <= 0;
  const maxAdd = madeToOrder ? 99 - inCart : Math.max(0, product.stock - inCart);

  const onAdd = () => {
    if (out) return;
    if (maxAdd <= 0) { toast(madeToOrder ? "That is the maximum quantity per order." : `You already have all ${product.stock} in stock in your cart.`, "info"); return; }
    add({ productId: product.id, slug: product.slug, name: product.name, unit: product.unit, priceCents: product.price_cents, imageUrl: product.image_url, emoji: product.emoji, stock: madeToOrder ? 99 : product.stock }, Math.min(qty, maxAdd));
    toast(`${product.name} added to cart`);
    setAdded(true); setTimeout(() => setAdded(false), 1200);
  };
  const sz = size === "lg" ? "px-6 py-3 text-base" : size === "sm" ? "btn-sm" : "";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {withQty && !out && (
        <div className="inline-flex items-center rounded-xl border border-line bg-white">
          <button type="button" aria-label="Decrease" className="px-3 py-2.5 hover:text-leaf-800" onClick={() => setQty((q) => Math.max(1, q - 1))}><Minus className="h-4 w-4" /></button>
          <span className="w-8 text-center text-sm font-semibold tabular-nums">{qty}</span>
          <button type="button" aria-label="Increase" className="px-3 py-2.5 hover:text-leaf-800" onClick={() => setQty((q) => Math.min(Math.max(1, maxAdd), q + 1))}><Plus className="h-4 w-4" /></button>
        </div>
      )}
      <button type="button" onClick={onAdd} disabled={out} className={cn("btn-primary", sz, size === "lg" && "flex-1")} aria-label={`Add ${product.name} to cart`}>
        {added ? <Check className="h-4 w-4" /> : <ShoppingBasket className="h-4 w-4" />}
        {out ? "Unavailable" : added ? "Added" : size === "sm" ? "Add" : "Add to cart"}
      </button>
    </div>
  );
}
