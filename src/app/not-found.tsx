import Link from "next/link";
import { SearchX } from "lucide-react";
export default function NotFound() {
  return <div className="container-x py-24 text-center"><SearchX className="mx-auto h-14 w-14 text-leaf-300" /><h1 className="mt-4 text-3xl font-extrabold">Page not found</h1><p className="mt-2 text-gray-600">This page slipped away. Let&apos;s get you back to the fruit.</p><Link href="/shop" className="btn-primary mt-6">Go to shop</Link></div>;
}
