import Link from "next/link";
import type { Product } from "@/lib/types";
import { Price } from "./Price";
import { AddToCartButton } from "./cart/AddToCartButton";
import { ProductImage } from "./ProductImage";
import { Stars } from "./shop/Stars";
import { AvailabilityTag } from "./shop/AvailabilityTag";
import { WishlistButton } from "./shop/WishlistButton";

export function ProductCard({ product, rating }: { product: Product; rating?: { avg: number; count: number } }) {
  const discount = product.compare_at_cents && product.compare_at_cents > product.price_cents ? Math.round((1 - product.price_cents / product.compare_at_cents) * 100) : 0;
  return (
    <div className="card group relative flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lift">
      <Link href={`/shop/${product.slug}`} className="relative block aspect-square overflow-hidden bg-leaf-50">
        <ProductImage product={product} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw" />
        <div className="absolute left-3 top-3 flex flex-col gap-1">
          {product.badge && <span className="badge bg-peel-600 text-white shadow-soft">{product.badge}</span>}
          {discount > 0 && <span className="badge bg-white/90 text-peel-700">-{discount}%</span>}
        </div>
        <AvailabilityTag product={product} className="absolute bottom-3 right-3" />
      </Link>
      <WishlistButton product={product} className="absolute right-3 top-3" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link href={`/shop/${product.slug}`} className="line-clamp-1 font-semibold hover:text-leaf-800">{product.name}</Link>
            <p className="text-xs text-gray-500">{product.category_name}{product.origin ? ` · ${product.origin}` : ""}</p>
            {rating && rating.count > 0 && <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500"><Stars value={rating.avg} /><span>{rating.avg} ({rating.count})</span></p>}
          </div>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <Price cents={product.price_cents} compareAt={product.compare_at_cents} unit={product.unit} />
          <AddToCartButton product={product} size="sm" />
        </div>
      </div>
    </div>
  );
}
