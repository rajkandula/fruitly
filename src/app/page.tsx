import Link from "next/link";
import { ArrowRight, Leaf, Truck, ShieldCheck, RotateCcw, Sprout, Snowflake } from "lucide-react";
import { ProductImage } from "@/components/ProductImage";
import { listCategories, listProducts } from "@/lib/repo/products";
import { ProductGrid } from "@/components/shop/ProductGrid";

export default async function HomePage() {
  const [{ products: featured }, { products: newest }, categories] = await Promise.all([
    listProducts({ featured: true, limit: 8 }),
    listProducts({ sort: "newest", limit: 4 }),
    listCategories(),
  ]);
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,_#dcfce7_0%,_transparent_55%),radial-gradient(ellipse_at_bottom_right,_#ffedd5_0%,_transparent_55%)]" />
        <div className="container-x grid items-center gap-10 py-14 md:grid-cols-2 md:py-24">
          <div className="animate-fade-up">
            <span className="badge bg-leaf-100 text-leaf-800"><Leaf className="mr-1.5 h-3.5 w-3.5" />Picked this morning · Delivered today</span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-leaf-900 sm:text-5xl lg:text-6xl">Fresh fruit,<br /><span className="text-peel-600">ridiculously</span> good.</h1>
            <p className="mt-5 max-w-lg text-lg text-gray-600">Hand-graded Alphonso mangoes, Hammonton blueberries, Jersey peaches and gift baskets worth bragging about. Delivered fresh across North Jersey — free over $50.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="btn-primary px-6 py-3 text-base">Shop all fruit <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/shop?category=boxes" className="btn-secondary px-6 py-3 text-base">Gift boxes</Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
              <span className="inline-flex items-center gap-2"><Truck className="h-4 w-4 text-leaf-700" />Same-day delivery</span>
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-leaf-700" />Freshness guaranteed</span>
              <span className="inline-flex items-center gap-2"><RotateCcw className="h-4 w-4 text-leaf-700" />Easy returns</span>
            </div>
          </div>
          <div className="relative mx-auto grid w-full max-w-md grid-cols-3 gap-3 md:max-w-none">
            {featured.slice(0, 9).map((p, i) => (
              <Link key={p.id} href={`/shop/${p.slug}`} className="group relative aspect-square overflow-hidden rounded-3xl bg-white shadow-soft" style={{ animationDelay: `${(i % 4) * 0.6}s` }}>
                <ProductImage product={p} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/50 to-transparent px-2.5 pb-1.5 pt-5 text-[11px] font-medium text-white opacity-0 transition group-hover:opacity-100">{p.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-x py-10">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Shop by category</h2>
          <Link href="/shop" className="link text-sm">View all</Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {categories.map((c) => (
            <Link key={c.id} href={`/shop?category=${c.slug}`} className="card group flex flex-col items-start gap-1 p-4 transition hover:-translate-y-0.5 hover:border-leaf-500">
              <span className="text-sm font-semibold group-hover:text-leaf-800">{c.name}</span>
              <span className="text-xs text-gray-500">{c.product_count} items</span>
              <ArrowRight className="mt-1 h-3.5 w-3.5 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-leaf-700" />
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="container-x py-10">
        <div className="mb-5 flex items-end justify-between">
          <div><h2 className="text-2xl font-bold tracking-tight">This week&apos;s favourites</h2><p className="text-sm text-gray-600">Best of the season, hand-picked by our buyers.</p></div>
          <Link href="/shop?sort=featured" className="link text-sm">See more</Link>
        </div>
        <ProductGrid products={featured} />
      </section>

      {/* Promo */}
      <section className="container-x py-10">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card relative overflow-hidden bg-gradient-to-br from-leaf-800 to-leaf-900 p-7 text-white md:col-span-2">
            <div className="relative z-10 max-w-md">
              <span className="badge bg-white/15 text-white">New customers</span>
              <h3 className="mt-3 text-3xl font-extrabold">10% off your first order</h3>
              <p className="mt-2 text-leaf-100">Use code <b className="rounded bg-white/15 px-1.5 py-0.5 font-mono">WELCOME10</b> at checkout on orders over $15.</p>
              <Link href="/signup" className="btn-accent mt-5">Create an account</Link>
            </div>
            <Leaf className="absolute -right-10 -top-10 h-72 w-72 rotate-12 text-white/10" strokeWidth={1} />
          </div>
          <div className="card flex flex-col justify-between p-7">
            <div><Leaf className="h-8 w-8 text-leaf-700" /><h3 className="mt-3 text-xl font-bold">Why Fruitly?</h3><p className="mt-2 text-sm text-gray-600">We grade every piece by hand, chill berries within the hour and only ship what we&apos;d serve our own families.</p></div>
            <Link href="/shop" className="link mt-4 text-sm">Start shopping →</Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container-x py-10">
        <h2 className="text-2xl font-bold tracking-tight">How Fruitly works</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[{ icon: Sprout, t: "Picked at dawn", d: "We buy at Hunts Point and from Jersey farms the morning it's picked, and grade every crate by hand." }, { icon: Snowflake, t: "Chilled within the hour", d: "Berries and stone fruit go straight into the cold chain so they arrive firm and fragrant." }, { icon: Truck, t: "At your door today", d: "Order before 2pm for same-day delivery. Not perfect? We replace or refund — no questions." }].map(({ icon: Icon, t, d }) => (
            <div key={t} className="card p-6"><span className="grid h-11 w-11 place-items-center rounded-xl bg-leaf-50 text-leaf-700"><Icon className="h-5 w-5" /></span><h3 className="mt-3 font-bold">{t}</h3><p className="mt-1 text-sm text-gray-600">{d}</p></div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="container-x py-10">
        <h2 className="text-2xl font-bold tracking-tight">Loved by fruit people</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[["Priya S.", "The Alphonso box was unreal — ripened perfectly in two days, zero fibre. Already ordered again."], ["Marcus T.", "Strawberries actually taste like strawberries. My kids finish a punnet before I've put the shopping away."], ["Elena R.", "Sent the Seasonal Basket as a gift and got three texts about it. Packaging is gorgeous."]].map(([n, q]) => (
            <figure key={n} className="card p-6"><div className="text-sm tracking-[0.2em] text-amber-400">★★★★★</div><blockquote className="mt-2 text-sm text-gray-700">“{q}”</blockquote><figcaption className="mt-3 text-xs font-semibold text-gray-500">{n}</figcaption></figure>
          ))}
        </div>
      </section>

      {/* New */}
      <section className="container-x py-10">
        <div className="mb-5 flex items-end justify-between"><h2 className="text-2xl font-bold tracking-tight">Just arrived</h2><Link href="/shop?sort=newest" className="link text-sm">See all new</Link></div>
        <ProductGrid products={newest} className="grid grid-cols-2 gap-4 md:grid-cols-4" />
      </section>
    </div>
  );
}
