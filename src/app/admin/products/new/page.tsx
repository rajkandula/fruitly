import { listAdminProducts, listCategories } from "@/lib/repo/products";
import { ProductForm } from "@/components/admin/ProductForm";
import { storageEnabled } from "@/lib/storage";
import { env } from "@/lib/env";

export default async function NewProduct() {
  const [categories, all] = await Promise.all([listCategories(), listAdminProducts()]);
  const stores = [...new Set(all.map((p) => p.source_store).filter(Boolean) as string[])];
  return <div className="card p-5"><h2 className="text-lg font-bold">New product</h2><ProductForm categories={categories} storage={storageEnabled()} madeToOrder={env.madeToOrder} stores={stores} /></div>;
}
