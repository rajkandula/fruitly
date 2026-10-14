"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "../Toaster";
export function ProductRowActions({ id, slug }: { id: number; slug: string }) {
  const router = useRouter(); const { toast } = useToast();
  const del = async () => { if (!confirm("Delete this product? Existing orders keep their line items.")) return; const r = await fetch(`/api/admin/products/${id}`, { method: "DELETE" }); if (r.ok) { toast("Product deleted"); router.refresh(); } else toast("Delete failed", "error"); };
  return <div className="flex justify-end gap-2 text-xs"><Link href={`/shop/${slug}`} className="link" target="_blank">View</Link><Link href={`/admin/products/${id}`} className="link">Edit</Link><button onClick={del} className="text-red-600 hover:underline">Delete</button></div>;
}
