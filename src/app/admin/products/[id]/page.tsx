import { notFound } from "next/navigation";
import { getAdminProductById, listAdminProducts, listCategories } from "@/lib/repo/products";
import { ProductForm } from "@/components/admin/ProductForm";
import { storageEnabled } from "@/lib/storage";
import { env } from "@/lib/env";

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const product = await getAdminProductById(Number((await params).id));
  if (!product) notFound();
  const [categories, all] = await Promise.all([listCategories(), listAdminProducts()]);
  const stores = [...new Set(all.map((p) => p.source_store).filter(Boolean) as string[])];
  return <div className="card p-5"><h2 className="text-lg font-bold">Edit product</h2><ProductForm categories={categories} product={product} storage={storageEnabled()} madeToOrder={env.madeToOrder} stores={stores} /></div>;
}
