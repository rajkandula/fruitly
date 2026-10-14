/* eslint-disable @next/next/no-img-element */
import { ImageIcon } from "lucide-react";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Product image with a neutral placeholder fallback. Plain <img> so storage-proxied and static images render without the optimizer. */
export function ProductImage({ product, className, sizes, priority }: { product: Pick<Product, "name" | "image_url" | "emoji">; className?: string; sizes?: string; priority?: boolean }) {
  if (product.image_url) {
    return <img src={product.image_url} alt={product.name} className={className} sizes={sizes} loading={priority ? "eager" : "lazy"} decoding="async" />;
  }
  return <div className={cn("flex items-center justify-center bg-leaf-50 text-leaf-200", className)} aria-label={product.name}><ImageIcon className="h-10 w-10" /></div>;
}
