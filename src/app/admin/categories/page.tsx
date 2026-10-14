import { listCategories } from "@/lib/repo/products";
import { CategoriesManager } from "@/components/admin/CategoriesManager";
export default async function AdminCategories() {
  return <div className="card p-5"><h2 className="text-lg font-bold">Categories</h2><CategoriesManager categories={await listCategories()} /></div>;
}
