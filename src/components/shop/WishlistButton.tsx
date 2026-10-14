"use client";
import { Heart } from "lucide-react";
import { useWishlist } from "./WishlistProvider";
import { useToast } from "../Toaster";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";
export function WishlistButton({ product, className, withLabel }: { product: Pick<Product, "id" | "name">; className?: string; withLabel?: boolean }) {
  const { has, toggle, hydrated } = useWishlist(); const { toast } = useToast();
  const saved = hydrated && has(product.id);
  const onClick = () => { const added = toggle(product.id); toast(added ? `Saved ${product.name} to your wishlist` : `Removed ${product.name} from wishlist`, "info"); };
  return (
    <button type="button" onClick={onClick} aria-pressed={saved} aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      className={cn(withLabel ? "btn-secondary" : "grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-soft transition hover:scale-105", className)}>
      <Heart className={cn("h-4 w-4 transition", saved ? "fill-red-500 text-red-500" : "text-gray-500")} />{withLabel && (saved ? "Saved" : "Save")}
    </button>
  );
}
