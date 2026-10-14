import type { Metadata } from "next";
import credits from "@/lib/image-credits.json";
import { listProducts } from "@/lib/repo/products";

export const metadata: Metadata = { title: "Photo credits" };

export default async function CreditsPage() {
  const { products } = await listProducts({ includeInactive: true, limit: 200 });
  const nameOf = new Map(products.map((p) => [p.slug, p.name]));
  const entries = Object.entries(credits as Record<string, { title: string; page: string; license: string; artist: string }[]>);
  return (
    <div className="container-x py-10">
      <h1 className="text-3xl font-bold tracking-tight">Photo credits</h1>
      <p className="mt-2 max-w-2xl text-sm text-gray-600">Product photography on this site is sourced from Wikimedia Commons under the licenses noted below. We&apos;re grateful to the photographers.</p>
      <ul className="mt-6 grid gap-2 text-sm md:grid-cols-2">
        {entries.map(([slug, items]) => items.map((c, i) => (
          <li key={`${slug}-${i}`} className="card px-4 py-3">
            <b>{nameOf.get(slug) ?? slug}</b>
            <span className="text-gray-600"> — “{c.title.replace(/\.(jpe?g|png)$/i, "")}”{c.artist ? ` by ${c.artist}` : ""}, </span>
            <a href={c.page} target="_blank" rel="noreferrer" className="link">{c.license || "Public domain"}</a>
          </li>
        )))}
      </ul>
    </div>
  );
}
