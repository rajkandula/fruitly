import { env } from "@/lib/env";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * What customers see about availability.
 * In made-to-order mode we buy each order fresh, so we show a status, never a stock count.
 */
export function AvailabilityTag({ product, className, long }: { product: Pick<Product, "stock" | "availability">; className?: string; long?: boolean }) {
  if (env.madeToOrder) {
    const map = {
      available: null,
      limited: { text: long ? "Limited — we'll confirm availability" : "Limited", cls: "bg-amber-100 text-amber-800" },
      seasonal: { text: long ? "In season now" : "In season", cls: "bg-leaf-100 text-leaf-800" },
      unavailable: { text: long ? "Currently unavailable" : "Unavailable", cls: "bg-gray-900/80 text-white" },
    } as const;
    const v = map[product.availability ?? "available"];
    if (!v) return long ? <span className={cn("text-sm font-medium text-leaf-700", className)}>Available to order</span> : null;
    return <span className={cn("badge", v.cls, className)}>{v.text}</span>;
  }
  if (product.stock <= 0) return <span className={cn("badge bg-gray-900/80 text-white", className)}>Sold out</span>;
  if (product.stock <= 10) return <span className={cn("badge bg-amber-100 text-amber-800", className)}>{long ? `Only ${product.stock} left` : `Only ${product.stock} left`}</span>;
  return long ? <span className={cn("text-sm font-medium text-leaf-700", className)}>In stock</span> : null;
}
