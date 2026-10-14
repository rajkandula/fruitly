import { handler, json } from "@/lib/api";
import { listCategories } from "@/lib/repo/products";
export const GET = handler(async () => json({ categories: await listCategories() }));
