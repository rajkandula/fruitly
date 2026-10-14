import type { Product } from "@/lib/types";
import { ratingsForProducts } from "@/lib/repo/reviews";
import { ProductCard } from "@/components/ProductCard";
/** Server component: renders product cards with their aggregate ratings in one query. */
export async function ProductGrid({ products, className = "grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4" }: { products: Product[]; className?: string }) {
  const ratings = await ratingsForProducts(products.map((p) => p.id));
  return <div className={className}>{products.map((p) => <ProductCard key={p.id} product={p} rating={ratings.get(p.id)} />)}</div>;
}
