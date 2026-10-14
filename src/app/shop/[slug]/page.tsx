import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Truck, Leaf, MapPin } from "lucide-react";
import { getProductBySlug, relatedProducts } from "@/lib/repo/products";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { ProductImage } from "@/components/ProductImage";
import { Price } from "@/components/Price";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { AiTips } from "@/components/shop/AiTips";
import { aiEnabled } from "@/lib/ai";
import { safeJsonParse } from "@/lib/utils";
import { Reviews } from "@/components/shop/Reviews";
import { Stars } from "@/components/shop/Stars";
import { WishlistButton } from "@/components/shop/WishlistButton";
import { listReviews, ratingSummary } from "@/lib/repo/reviews";
import { getCurrentUser } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { AvailabilityTag } from "@/components/shop/AvailabilityTag";

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProductBySlug((await params).slug);
  return p ? { title: p.name, description: p.description.slice(0, 160) } : { title: "Product" };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProductBySlug((await params).slug);
  if (!product) notFound();
  const [related, reviews, summary, user] = await Promise.all([relatedProducts(product), listReviews(product.id), ratingSummary(product.id), getCurrentUser()]);
  const jsonLd = {
    "@context": "https://schema.org", "@type": "Product", name: product.name, description: product.description, image: product.image_url ? `${env.appUrl}${product.image_url.startsWith("/") ? "" : "/"}${product.image_url}` : undefined,
    brand: { "@type": "Brand", name: env.appName }, sku: product.slug,
    offers: { "@type": "Offer", priceCurrency: env.currency, price: (product.price_cents / 100).toFixed(2), availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url: `${env.appUrl}/shop/${product.slug}` },
    ...(summary.count ? { aggregateRating: { "@type": "AggregateRating", ratingValue: summary.avg, reviewCount: summary.count } } : {}),
  };
  const nutrition = safeJsonParse<Record<string, string>>(product.nutrition, {});
  const discount = product.compare_at_cents && product.compare_at_cents > product.price_cents ? Math.round((1 - product.price_cents / product.compare_at_cents) * 100) : 0;
  return (
    <div className="container-x py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="text-xs text-gray-500"><Link href="/" className="hover:text-leaf-800">Home</Link> / <Link href="/shop" className="hover:text-leaf-800">Shop</Link>{product.category_slug && <> / <Link href={`/shop?category=${product.category_slug}`} className="hover:text-leaf-800">{product.category_name}</Link></>} / <span className="text-ink">{product.name}</span></nav>
      <div className="mt-4 grid gap-8 lg:grid-cols-2">
        <div className="card relative overflow-hidden">
          <ProductImage product={product} className="aspect-square w-full object-cover" priority />
          <div className="absolute left-4 top-4 flex gap-2">
            {product.badge && <span className="badge bg-peel-600 text-white">{product.badge}</span>}
            {discount > 0 && <span className="badge bg-white/90 text-peel-700">Save {discount}%</span>}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-leaf-700">{product.category_name}</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{product.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
            {product.origin && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{product.origin}</span>}
            {summary.count > 0 ? <a href="#reviews" className="inline-flex items-center gap-1.5 hover:text-leaf-800"><Stars value={summary.avg} /><span>{summary.avg} ({summary.count})</span></a> : <a href="#reviews" className="hover:text-leaf-800">No reviews yet</a>}
          </div>
          <div className="mt-5"><Price cents={product.price_cents} compareAt={product.compare_at_cents} unit={product.unit} size="lg" /></div>
          <p className="mt-2"><AvailabilityTag product={product} long /></p>
          {env.madeToOrder && <p className="mt-1 text-xs text-gray-500">Hand-picked for your order and delivered in your chosen window.</p>}
          <div className="mt-6 flex flex-wrap items-center gap-2"><AddToCartButton product={product} size="lg" withQty className="flex-1" madeToOrder={env.madeToOrder} /><WishlistButton product={product} withLabel /></div>
          <div className="mt-6 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div className="flex items-start gap-2 rounded-xl bg-white p-3 border border-line"><Truck className="mt-0.5 h-4 w-4 text-leaf-700" /><div><b>Same-day delivery</b><br /><span className="text-gray-600">Order before 2pm · free over $50</span></div></div>
            <div className="flex items-start gap-2 rounded-xl bg-white p-3 border border-line"><Leaf className="mt-0.5 h-4 w-4 text-leaf-700" /><div><b>Freshness promise</b><br /><span className="text-gray-600">Not happy? We replace or refund</span></div></div>
          </div>
          <div className="prose-sm mt-8 text-gray-700"><h2 className="mb-2 text-lg font-bold text-ink">About</h2><p>{product.description}</p></div>
          {Object.keys(nutrition).length > 0 && (
            <div className="mt-6"><h2 className="mb-2 text-lg font-bold">Nutrition</h2>
              <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">{Object.entries(nutrition).map(([k, v]) => <div key={k} className="rounded-xl border border-line bg-white p-3"><dt className="text-xs uppercase tracking-wide text-gray-500">{k.replace(/([A-Z])/g, " $1")}</dt><dd className="font-semibold">{v}</dd></div>)}</dl>
            </div>
          )}
          {aiEnabled() && <AiTips slug={product.slug} name={product.name} />}
        </div>
      </div>
      <Reviews slug={product.slug} initialReviews={reviews} summary={summary} user={user ? { id: user.id, verified: !!user.email_verified } : null} />
      {related.length > 0 && (
        <section className="mt-14"><h2 className="mb-4 text-2xl font-bold tracking-tight">You might also like</h2>
          <ProductGrid products={related} className="grid grid-cols-2 gap-4 md:grid-cols-4" /></section>
      )}
    </div>
  );
}
