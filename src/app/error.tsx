"use client";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="container-x py-24 text-center"><AlertTriangle className="mx-auto h-14 w-14 text-amber-400" /><h1 className="mt-4 text-3xl font-extrabold">Something went wrong</h1><p className="mt-2 text-gray-600">{error.message || "An unexpected error occurred."}</p><div className="mt-6 flex justify-center gap-3"><button onClick={reset} className="btn-primary">Try again</button><Link href="/" className="btn-secondary">Home</Link></div></div>;
}
